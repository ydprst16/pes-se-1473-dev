<?php
ini_set('display_errors', '0');
error_reporting(E_ALL);
register_shutdown_function(function () {
    $e = error_get_last();
    if ($e && in_array($e['type'], [E_ERROR, E_PARSE, E_CORE_ERROR, E_COMPILE_ERROR])) {
        http_response_code(500);
        header('Content-Type: application/json; charset=utf-8');
        echo json_encode(['status'=>'error','message'=>'PHP error: '.$e['message']]);
    }
});
if (file_exists(__DIR__.'/config.local.php')) require_once __DIR__.'/config.local.php';
require_once __DIR__.'/lib_security.php';
date_default_timezone_set('Asia/Jakarta');
header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: no-store');

$SB_URL = getenv('SUPABASE_URL') ?: '';
$SB_KEY = getenv('SUPABASE_SERVICE_KEY') ?: '';
$BUCKET = getenv('SUPABASE_BUCKET') ?: 'data';
$PREFIX = 'business_presence/';
if (!$SB_URL || !$SB_KEY) { http_response_code(500); echo json_encode(['status'=>'error','message'=>'Supabase belum dikonfigurasi.']); exit; }

function bp_sb($method, $path, $headers=[], $body=null) {
    global $SB_URL, $SB_KEY;
    $ch = curl_init(rtrim($SB_URL,'/').'/storage/v1'.$path);
    curl_setopt_array($ch,[CURLOPT_CUSTOMREQUEST=>$method,CURLOPT_RETURNTRANSFER=>true,CURLOPT_HTTPHEADER=>array_merge(['Authorization: Bearer '.$SB_KEY,'apikey: '.$SB_KEY],$headers),CURLOPT_TIMEOUT=>60,CURLOPT_CONNECTTIMEOUT=>10]);
    if ($body !== null) curl_setopt($ch,CURLOPT_POSTFIELDS,$body);
    $out=curl_exec($ch); $code=curl_getinfo($ch,CURLINFO_HTTP_CODE); $err=curl_error($ch); curl_close($ch);
    return ['code'=>$code,'body'=>$out,'error'=>$err];
}
function bp_upload($path,$content) { global $BUCKET; return bp_sb('POST',"/object/{$BUCKET}/".$path,['Content-Type: application/json','x-upsert: true'],$content); }
function bp_download($path) { global $BUCKET; return bp_sb('GET',"/object/{$BUCKET}/".$path); }
function bp_list($prefix) { global $BUCKET; return bp_sb('POST',"/object/list/{$BUCKET}",['Content-Type: application/json'],json_encode(['prefix'=>$prefix,'limit'=>1000,'offset'=>0,'sortBy'=>['column'=>'name','order'=>'desc']])); }
function bp_fail($message,$code=400) { http_response_code($code); echo json_encode(['status'=>'error','message'=>$message],JSON_UNESCAPED_UNICODE); exit; }

$action=$_GET['action'] ?? '';
try {
    if ($action==='upload' && $_SERVER['REQUEST_METHOD']==='POST') {
        $auth=sec_verify_upload_password($_POST['password'] ?? '');
        if (!$auth['ok']) bp_fail($auth['error'],$auth['code']);
        $date=$_POST['date'] ?? date('Y-m-d');
        $filename=basename($_POST['filename'] ?? 'business-presence.xlsx');
        if (!preg_match('/^\d{4}-\d{2}-\d{2}$/',$date) || !checkdate((int)substr($date,5,2),(int)substr($date,8,2),(int)substr($date,0,4))) bp_fail('Tanggal snapshot tidak valid.');
        $raw=$_POST['payload'] ?? file_get_contents('php://input');
        if (!$raw) bp_fail('Payload JSON kosong.');
        if (strlen($raw)>25*1024*1024) bp_fail('Payload melebihi batas 25 MB.',413);
        $decoded=json_decode($raw,true);
        if (!is_array($decoded) || !isset($decoded['records']) || !is_array($decoded['records'])) bp_fail('Format payload tidak valid.');
        $records=$decoded['records'];
        if (!$records) bp_fail('Tidak ada baris data untuk diimport.');
        $required=['prov','kab','kec','des','sls','ssls','id','ada_bang_usaha_label'];
        $seen=[]; $valid=[]; $invalid=[];
        foreach ($records as $i=>$r) {
            $missing=[]; foreach ($required as $k) if (!array_key_exists($k,$r)) $missing[]=$k;
            if ($missing) { $invalid[]=['row'=>$i+2,'reason'=>'Kolom tidak lengkap: '.implode(', ',$missing)]; continue; }
            $codes=[]; foreach (['prov','kab','kec','des','sls','ssls'] as $k) $codes[$k]=trim((string)$r[$k]);
            $id=trim((string)$r['id']);
            $idsubsls=implode('',array_values($codes));
            if (!preg_match('/^\d{16}$/',$idsubsls)) { $invalid[]=['row'=>$i+2,'reason'=>'Kode wilayah tidak membentuk idsubsls 16 digit']; continue; }
            if ($id==='') { $invalid[]=['row'=>$i+2,'reason'=>'UUID assignment kosong']; continue; }
            if (isset($seen[$id])) { $invalid[]=['row'=>$i+2,'reason'=>'UUID assignment duplikat dalam file']; continue; }
            $seen[$id]=true;
            $r['id']= $id; foreach ($codes as $k=>$v) $r[$k]=$v;
            $r['idsubsls']=$idsubsls;
            $r['ada_bang_usaha_label']=trim((string)($r['ada_bang_usaha_label'] ?? ''));
            $valid[]=$r;
        }
        if (!$valid) bp_fail('Tidak ada record valid. Periksa format Excel.');
        $payload=['schemaVersion'=>1,'module'=>'business_presence','importDate'=>$date,'uploadedAt'=>date(DATE_ATOM),'sourceFile'=>$filename,'totalRows'=>count($records),'validRows'=>count($valid),'invalidRows'=>count($invalid),'records'=>$valid,'validationErrors'=>array_slice($invalid,0,200)];
        $json=json_encode($payload,JSON_UNESCAPED_UNICODE|JSON_UNESCAPED_SLASHES);
        if ($json===false) bp_fail('Gagal membentuk JSON: '.json_last_error_msg(),500);
        // Simpan snapshot terlebih dahulu; latest hanya diperbarui setelah snapshot sukses.
        $snapshot=bp_upload($GLOBALS['PREFIX'].'history/'.$date.'.json',$json);
        if ($snapshot['code']>=400) bp_fail('Gagal menyimpan snapshot: '.$snapshot['body'],502);
        $latest=bp_upload($GLOBALS['PREFIX'].'latest.json',$json);
        if ($latest['code']>=400) bp_fail('Snapshot tersimpan, tetapi latest gagal diperbarui: '.$latest['body'],502);
        sec_audit_write(['action'=>'business_presence_upload','filename'=>$filename,'date'=>$date,'size'=>strlen($json),'status'=>'success','error'=>null]);
        echo json_encode(['status'=>'ok','date'=>$date,'totalRows'=>count($records),'validRows'=>count($valid),'invalidRows'=>count($invalid),'latestPath'=>$GLOBALS['PREFIX'].'latest.json','historyPath'=>$GLOBALS['PREFIX'].'history/'.$date.'.json']);
        exit;
    }
    if ($action==='latest' || $action==='get') {
        $path=$PREFIX.($action==='latest'?'latest.json':'history/'.($_GET['date'] ?? '').'.json');
        if ($action==='get' && !preg_match('/^\d{4}-\d{2}-\d{2}$/',$_GET['date'] ?? '')) bp_fail('Tanggal tidak valid.');
        $r=bp_download($path); if ($r['code']>=400) bp_fail('Data Keberadaan Usaha tidak ditemukan.',404);
        echo $r['body']; exit;
    }
    if ($action==='list') {
        $r=bp_list($PREFIX.'history/'); if ($r['code']>=400) bp_fail('Gagal mengambil histori.');
        $files=json_decode($r['body'],true) ?: []; $items=[];
        foreach ($files as $f) if (preg_match('/^(\d{4}-\d{2}-\d{2})\.json$/',$f['name'] ?? '',$m)) $items[]=['date'=>$m[1],'updated_at'=>$f['updated_at'] ?? ($f['created_at'] ?? null)];
        usort($items,fn($a,$b)=>strcmp($b['date'],$a['date'])); echo json_encode(['status'=>'ok','items'=>$items]); exit;
    }
    bp_fail('Action tidak dikenal.',404);
} catch (Throwable $e) {
    sec_audit_write(['action'=>'business_presence_upload','status'=>'failed','error'=>$e->getMessage()]);
    bp_fail($e->getMessage(),500);
}

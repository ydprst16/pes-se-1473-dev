<?php
ini_set('display_errors','0'); error_reporting(E_ALL);
register_shutdown_function(function(){ $e=error_get_last(); if($e && in_array($e['type'],[E_ERROR,E_PARSE,E_CORE_ERROR,E_COMPILE_ERROR])){ http_response_code(500); header('Content-Type: application/json; charset=utf-8'); echo json_encode(['status'=>'error','message'=>'PHP error: '.$e['message']]); }});
if(file_exists(__DIR__.'/config.local.php')) require_once __DIR__.'/config.local.php';
require_once __DIR__.'/lib_security.php';
date_default_timezone_set('Asia/Jakarta'); header('Content-Type: application/json; charset=utf-8'); header('Cache-Control: no-store');
$env=sec_sb_env(); $prefix='deployment/';
function dep_fail($m,$c=400){http_response_code($c);echo json_encode(['status'=>'error','message'=>$m],JSON_UNESCAPED_UNICODE|JSON_UNESCAPED_SLASHES);exit;}
function dep_req($method,$path,$headers=[],$body=null){$r=sec_sb_request($method,$path,$headers,$body);return ['code'=>$r['status_code'],'body'=>$r['body'],'error'=>$r['error']];}
function dep_upload($path,$body){$e=sec_sb_env();return dep_req('POST',"/object/{$e['bucket']}/".$path,['Content-Type: application/json','x-upsert: true'],$body);}
function dep_download($path){$e=sec_sb_env();return dep_req('GET',"/object/{$e['bucket']}/".$path.'?v='.rawurlencode((string)microtime(true)),['Cache-Control: no-cache']);}
function dep_list($path){$e=sec_sb_env();return dep_req('POST',"/object/list/{$e['bucket']}",['Content-Type: application/json'],json_encode(['prefix'=>$path,'limit'=>1000,'offset'=>0,'sortBy'=>['column'=>'name','order'=>'desc']]));}
try {
 $action=$_GET['action']??'';
 if($action==='upload' && $_SERVER['REQUEST_METHOD']==='POST'){
  $auth=sec_verify_upload_password($_POST['password']??''); if(!$auth['ok']) dep_fail($auth['error'],$auth['code']);
  $raw=$_POST['payload']??''; if($raw===''||strlen($raw)>15*1024*1024) dep_fail('Payload kosong atau melebihi 15 MB.',413);
  $data=json_decode($raw,true); if(!is_array($data)||!isset($data['ssls'])||!is_array($data['ssls'])) dep_fail('Struktur payload deployment tidak valid.');
  $date=$data['importDate']??''; $dt=DateTimeImmutable::createFromFormat('!Y-m-d',$date); $err=DateTimeImmutable::getLastErrors(); if(!$dt||($err && ($err['warning_count']||$err['error_count']))||$dt->format('Y-m-d')!==$date) dep_fail('Tanggal snapshot tidak valid.');
  $cats=['keluarga','usaha_keluarga','usaha_bku']; foreach($cats as $cat) if(!isset($data['sources'][$cat]['filename'],$data['sources'][$cat]['totalRows'])) dep_fail('Metadata file '.$cat.' tidak lengkap.');
  $clean=[]; foreach($data['ssls'] as $code=>$record){$id=preg_replace('/\D/','',(string)$code); if(strlen($id)!==16||!is_array($record)) dep_fail('Ditemukan SSLS tidak valid: '.htmlspecialchars((string)$code)); $clean[$id]=[]; foreach($cats as $cat){$statuses=$record[$cat]??[]; if(!is_array($statuses)) dep_fail('Format status '.$cat.' tidak valid.'); $clean[$id][$cat]=[]; foreach($statuses as $status=>$count){$n=filter_var($count,FILTER_VALIDATE_INT); if($n===false||$n<0) dep_fail('Jumlah assignment tidak valid pada '.$id); $clean[$id][$cat][(string)$status]=$n;}} }
  if(!$clean) dep_fail('Tidak ada SSLS valid.');
  $payload=['schemaVersion'=>1,'module'=>'deployment','importDate'=>$date,'uploadedAt'=>date(DATE_ATOM),'sources'=>$data['sources'],'ssls'=>$clean,'totalUniqueSsls'=>count($clean)];
  $json=json_encode($payload,JSON_UNESCAPED_UNICODE|JSON_UNESCAPED_SLASHES); if($json===false) dep_fail('Gagal membentuk JSON snapshot.',500);
  $history=$prefix.'history/'.$date.'.json'; $r=dep_upload($history,$json); if($r['error']||$r['code']<200||$r['code']>=300) dep_fail('Gagal menyimpan snapshot Supabase. HTTP='.$r['code'].' '.$r['body'],502);
  $verify=dep_download($history); $v=json_decode($verify['body'],true); if($verify['error']||$verify['code']!==200||($v['importDate']??'')!==$date||count($v['ssls']??[])!==count($clean)) dep_fail('Snapshot terunggah tetapi verifikasi baca ulang gagal. Periksa histori sebelum mengunggah ulang.',502);
  $latest=dep_download($prefix.'latest.json'); $latestData=(!$latest['error']&&$latest['code']===200)?json_decode($latest['body'],true):null; $latestDate=is_array($latestData)?($latestData['importDate']??''):''; $latestUpdated=false;
  if($latestDate===''||strcmp($date,$latestDate)>=0){$lr=dep_upload($prefix.'latest.json',$json); if($lr['error']||$lr['code']<200||$lr['code']>=300) dep_fail('Snapshot tersimpan, tetapi latest gagal diperbarui. HTTP='.$lr['code'],502); $latestUpdated=true;}
  sec_audit_write(['action'=>'deployment_upload','date'=>$date,'sources'=>$data['sources'],'ssls'=>count($clean),'status'=>'success','error'=>null]);
  echo json_encode(['status'=>'ok','date'=>$date,'totalUniqueSsls'=>count($clean),'latestUpdated'=>$latestUpdated,'latestDate'=>$latestUpdated?$date:$latestDate]); exit;
 }
 if($action==='latest'||$action==='get'){$date=$_GET['date']??''; if($action==='get'&&!preg_match('/^\d{4}-\d{2}-\d{2}$/',$date))dep_fail('Tanggal tidak valid.');$r=dep_download($prefix.($action==='latest'?'latest.json':'history/'.$date.'.json'));if($r['error']||$r['code']!==200)dep_fail('Snapshot deployment tidak ditemukan.',404);echo $r['body'];exit;}
 if($action==='list'){$r=dep_list($prefix.'history/');if($r['error']||$r['code']>=400)dep_fail('Gagal mengambil histori deployment.',502);$files=json_decode($r['body'],true)?:[];$items=[];foreach($files as $f)if(preg_match('/^(\d{4}-\d{2}-\d{2})\.json$/',$f['name']??'',$m))$items[]=['date'=>$m[1],'updated_at'=>$f['updated_at']??($f['created_at']??null)];usort($items,fn($a,$b)=>strcmp($b['date'],$a['date']));echo json_encode(['status'=>'ok','items'=>$items]);exit;}
 dep_fail('Action tidak dikenal.',404);
} catch(Throwable $e){sec_audit_write(['action'=>'deployment_api','status'=>'failed','error'=>$e->getMessage()]);dep_fail($e->getMessage(),500);}

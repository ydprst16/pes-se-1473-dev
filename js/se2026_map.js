/* SE2026 Sub-SLS distribution map: GeoJSON geometry joined to the latest deployment snapshot. */
(() => {
  "use strict";
  const GEOJSON_URL = "data/Prod_SLS_202611473.geojson";
  const DEPLOYMENT_URL = () =>
    `api/deployment.php?action=latest&_ts=${Date.now()}`;
  const OFFICER_URL = (role) =>
    `api/history.php?action=latest&role=${encodeURIComponent(role)}&_ts=${Date.now()}`;
  const CATEGORIES = ["keluarga", "usaha_keluarga", "usaha_bku"];
  const FOUND_NEW = ["1. Ditemukan", "2. Baru"];
  const COLORS = {
    complete: "#16865b",
    progress: "#eaaa08",
    none: "#64748b",
    unmatched: "#cbd5e1",
  };
  let map = null,
    geoLayer = null,
    tileLayer = null,
    geojson = null,
    snapshot = null;
  let featureRows = [],
    selectedLayer = null,
    selectedId = null,
    active = false,
    loading = false;
  let officerByRegion = new Map(),
    themeObserver = null,
    rowById = new Map();
  const $ = (id) => document.getElementById(id);
  const fmt = (n) => Number(n || 0).toLocaleString("id-ID");
  const pct = (n) =>
    `${Number(n || 0).toLocaleString("id-ID", { maximumFractionDigits: 1 })}%`;
  const idOf = (v) => String(v ?? "").replace(/\D/g, "");
  const esc = (v) =>
    String(v ?? "").replace(
      /[&<>"']/g,
      (c) =>
        ({
          "&": "&amp;",
          "<": "&lt;",
          ">": "&gt;",
          '"': "&quot;",
          "'": "&#39;",
        })[c],
    );
  const theme = () =>
    document.documentElement.getAttribute("data-bs-theme") === "dark"
      ? "dark"
      : "light";

  async function fetchJson(url, label) {
    const response = await fetch(url, { cache: "no-store" });
    if (!response.ok)
      throw new Error(`${label} tidak tersedia (HTTP ${response.status}).`);
    const data = await response.json();
    if (data?.status === "error")
      throw new Error(data.message || `${label} gagal dimuat.`);
    return data;
  }
  async function loadGeojson() {
    if (geojson) return geojson;
    geojson = await fetchJson(GEOJSON_URL, "GeoJSON Sub-SLS");
    if (
      geojson.type !== "FeatureCollection" ||
      !Array.isArray(geojson.features)
    )
      throw new Error("Struktur GeoJSON tidak valid.");
    return geojson;
  }
  async function loadSnapshot() {
    snapshot = await fetchJson(DEPLOYMENT_URL(), "Snapshot Deployment terbaru");
    if (!snapshot.ssls || typeof snapshot.ssls !== "object")
      throw new Error(
        "Struktur snapshot Deployment tidak memiliki data Sub-SLS.",
      );
    return snapshot;
  }
  async function loadOfficers() {
    officerByRegion = new Map();
    const roles = await Promise.allSettled([
      fetchJson(OFFICER_URL("pencacah"), "Data PPL"),
      fetchJson(OFFICER_URL("pengawas"), "Data PML"),
    ]);
    roles.forEach((result, index) => {
      if (result.status !== "fulfilled") return;
      const role = index === 0 ? "ppl" : "pml";
      const rows = Array.isArray(result.value.data) ? result.value.data : [];
      rows.forEach((person) => {
        const name = person.name || person.username || person.email || "-";
        (person.regionSummary || []).forEach((region) => {
          const id = idOf(region.regionCode);
          if (id.length !== 16) return;
          if (!officerByRegion.has(id))
            officerByRegion.set(id, { ppl: [], pml: [] });
          const list = officerByRegion.get(id)[role];
          if (!list.includes(name)) list.push(name);
        });
      });
    });
  }
  function aggregate(id, properties) {
    const record = snapshot?.ssls?.[id];
    const matched = !!record && typeof record === "object";
    const category = {};
    let assignment = 0,
      realization = 0;
    CATEGORIES.forEach((key) => {
      const statuses = record?.[key] || {};
      const total = Object.values(statuses).reduce(
        (sum, value) => sum + (Number(value) || 0),
        0,
      );
      const actual = FOUND_NEW.reduce(
        (sum, status) => sum + (Number(statuses[status]) || 0),
        0,
      );
      category[key] = { assignment: total, realization: actual };
      assignment += total;
      realization += actual;
    });
    const achievement = assignment > 0 ? (realization / assignment) * 100 : 0;
    const status = !matched
      ? "unmatched"
      : achievement >= 100 && assignment > 0
        ? "complete"
        : realization > 0
          ? "progress"
          : "none";
    const officers = officerByRegion.get(id) || { ppl: [], pml: [] };
    return {
      id,
      properties,
      matched,
      assignment,
      realization,
      achievement,
      category,
      status,
      ppl: officers.ppl,
      pml: officers.pml,
    };
  }
  function styleFor(row, selected = false, hover = false, emphasized = false) {
    const color = COLORS[row.status] || COLORS.unmatched;
    return {
      color: selected ? "#075985" : emphasized ? "#ffffff" : hover ? "#ffffff" : "#64748b",
      weight: selected ? 4 : emphasized ? 2.4 : hover ? 2 : 0.8,
      opacity: selected || emphasized ? 1 : 0.78,
      fillColor: color,
      fillOpacity: selected ? 0.98 : emphasized ? 0.94 : hover ? 0.88 : 0.72,
    };
  }
  function tooltipHtml(row) {
    const p = row.properties;
    return `<div class="map-tooltip-title">${esc(p.nmsls || "Sub-SLS")}</div><div>${esc(p.nmdesa || "-")} · ${esc(p.nmkec || "-")}</div><div class="map-tooltip-meta">ID ${esc(row.id)} · ${row.matched ? `${fmt(row.realization)} / ${fmt(row.assignment)} (${pct(row.achievement)})` : "Tidak ada data/bukan sample"}</div>`;
  }
  function filteredRows() {
    const kec = $("mapDistrictFilter")?.value || "",
      desa = $("mapVillageFilter")?.value || "",
      idFilter = $("mapIdFilter")?.value || "",
      status = $("mapStatusFilter")?.value || "",
      q = ($("mapSearch")?.value || "").trim().toLocaleLowerCase("id-ID");
    return featureRows.filter((row) => {
      const p = row.properties;
      if (kec && p.nmkec !== kec) return false;
      if (desa && p.nmdesa !== desa) return false;
      if (idFilter && row.id !== idFilter) return false;
      if (status && row.status !== status) return false;
      if (
        q &&
        ![row.id, p.nmsls, p.nmdesa, p.nmkec, p.idsls].some((v) =>
          String(v || "")
            .toLocaleLowerCase("id-ID")
            .includes(q),
        )
      )
        return false;
      return true;
    });
  }
  function updateKpis() {
    const count = { complete: 0, progress: 0, none: 0, unmatched: 0 };
    featureRows.forEach((row) => count[row.status]++);
    $("mapKpiTotal").textContent = fmt(featureRows.length);
    $("mapKpiComplete").textContent = fmt(count.complete);
    $("mapKpiProgress").textContent = fmt(count.progress);
    $("mapKpiNoProgress").textContent = fmt(count.none + count.unmatched);
    $("mapFeatureCount").textContent =
      `${fmt(filteredRows().length)} dari ${fmt(featureRows.length)} poligon`;
    const matched = featureRows.length - count.unmatched;
    const snapshotOnly = snapshot?.ssls
      ? Object.keys(snapshot.ssls).filter((id) => !rowById.has(id)).length
      : 0;
    $("mapDataNote").textContent =
      `Snapshot ${snapshot?.importDate || "belum tersedia"} · ${fmt(matched)} poligon memiliki pasangan ID Sub-SLS · ${fmt(count.unmatched)} poligon belum memiliki pasangan data · ${fmt(snapshotOnly)} ID snapshot tidak ditemukan pada GeoJSON. Status berdasarkan realisasi gabungan Ditemukan + Baru dari tiga kategori.`;
  }
  function renderDetail(row) {
    if (!row) {
      $("mapDetailContent").innerHTML =
        '<div class="map-empty-state"><i class="bi bi-cursor"></i><strong>Pilih poligon pada peta</strong><span>Arahkan kursor untuk melihat ringkasan, lalu klik poligon untuk mengunci detail wilayah.</span></div>';
      return;
    }
    const p = row.properties,
      statusLabels = {
        complete: "Target tercapai",
        progress: "Dalam proses",
        none: "Belum didata",
        unmatched: "Tidak ada data",
      };
    const categoryNames = {
      keluarga: "Keluarga",
      usaha_keluarga: "Usaha Keluarga",
      usaha_bku: "Usaha BKU",
    };
    const categoryRows = CATEGORIES.map(
      (key) =>
        `<tr><td>${categoryNames[key]}</td><td class="text-end">${fmt(row.category[key].assignment)}</td><td class="text-end">${fmt(row.category[key].realization)}</td></tr>`,
    ).join("");
    const officerLine = (label, values) =>
      `<div class="d-flex justify-content-between gap-3 py-1"><span class="text-secondary small">${label}</span><span class="small text-end">${values.length ? values.map(esc).join(", ") : "-"}</span></div>`;
    const progressWidth = Math.max(0, Math.min(100, row.achievement));
    $("mapDetailContent").innerHTML =
      `<div class="d-flex justify-content-between align-items-start gap-2"><div><h4 class="map-detail-title">${esc(p.nmsls || "Sub-SLS")}</h4><div class="map-detail-subtitle">${esc(p.nmdesa || "-")} · ${esc(p.nmkec || "-")}</div><div class="map-detail-id mt-1">ID Sub-SLS: ${esc(row.id)}</div></div><span class="map-status-pill ${row.status}">${statusLabels[row.status]}</span></div>
      <div class="map-detail-stats"><div class="map-detail-stat"><span>Total Assignment</span><strong>${row.matched ? fmt(row.assignment) : "—"}</strong></div><div class="map-detail-stat"><span>Realisasi Ditemukan + Baru</span><strong>${row.matched ? fmt(row.realization) : "—"}</strong></div></div>
      ${row.matched ? `<div class="d-flex justify-content-between small mb-1"><strong>Pencapaian gabungan</strong><strong>${pct(row.achievement)}</strong></div><div class="map-detail-progress"><span style="width:${progressWidth}%"></span></div>` : '<div class="small text-secondary">Tidak ditemukan pasangan ID Sub-SLS pada snapshot Deployment terbaru. Wilayah ini tidak dikategorikan sebagai belum didata.</div>'}
      <table class="map-detail-table"><thead><tr><th>Kategori</th><th class="text-end">Assignment</th><th class="text-end">Realisasi</th></tr></thead><tbody>${categoryRows}</tbody></table>
      <div class="mt-3"><strong class="small">Petugas terkait</strong>${officerLine("PPL", row.ppl)}${officerLine("PML", row.pml)}</div>
      <div class="small text-secondary mt-2">ID SLS: ${esc(p.idsls || "-")} · Luas: ${Number(p.luas || 0).toLocaleString("id-ID", { maximumFractionDigits: 3 })}</div>`;
  }
  function applyFilters() {
    if (!geoLayer) return;
    const rows = filteredRows(),
      visible = new Set(rows.map((r) => r.id));
    geoLayer.eachLayer((layer) => {
      const id = layer.feature?.properties?.idsubsls;
      const row = rowById.get(id);
      if (!row) return;
      if (visible.has(id)) {
        if (!map.hasLayer(layer)) layer.addTo(map);
        layer.setStyle(styleFor(row, selectedId === id, false, !!(document.getElementById("mapStatusFilter")?.value || document.getElementById("mapSearch")?.value.trim() || document.getElementById("mapIdFilter")?.value)));
      } else if (map.hasLayer(layer)) map.removeLayer(layer);
    });
    $("mapFeatureCount").textContent =
      `${fmt(rows.length)} dari ${fmt(featureRows.length)} poligon`;
    if (selectedId && !visible.has(selectedId)) {
      selectedId = null;
      selectedLayer = null;
      renderDetail(null);
    }
    updateKpis();
  }
  function setOptions(el, items, allLabel, selected = "") {
    if (!el) return;
    el.innerHTML =
      `<option value="">${esc(allLabel)}</option>` +
      items
        .map(
          (item) =>
            `<option value="${esc(item.value)}">${esc(item.label)}</option>`,
        )
        .join("");
    if (selected && items.some((item) => item.value === selected))
      el.value = selected;
  }
  function populateVillageOptions(selected = "") {
    const district = $("mapDistrictFilter")?.value || "";
    const villages = [
      ...new Set(
        featureRows
          .filter((r) => !district || r.properties.nmkec === district)
          .map((r) => r.properties.nmdesa)
          .filter(Boolean),
      ),
    ].sort((a, b) => a.localeCompare(b, "id"));
    setOptions(
      $("mapVillageFilter"),
      villages.map((v) => ({ value: v, label: v })),
      district ? "Semua Kelurahan di Kecamatan" : "Semua Kelurahan",
      selected,
    );
  }
  function populateIdOptions(selected = "") {
    const district = $("mapDistrictFilter")?.value || "",
      village = $("mapVillageFilter")?.value || "";
    const rows = featureRows
      .filter(
        (r) =>
          (!district || r.properties.nmkec === district) &&
          (!village || r.properties.nmdesa === village),
      )
      .sort((a, b) => a.id.localeCompare(b.id));
    setOptions(
      $("mapIdFilter"),
      rows.map((r) => ({
        value: r.id,
        label: `${r.id} · ${r.properties.nmsls || r.properties.nmdesa || "Sub-SLS"}`,
      })),
      rows.length ? "Pilih ID Sub-SLS" : "Tidak ada ID Sub-SLS",
      selected,
    );
  }
  function populateFilters() {
    const districts = [
      ...new Set(featureRows.map((r) => r.properties.nmkec).filter(Boolean)),
    ].sort((a, b) => a.localeCompare(b, "id"));
    setOptions(
      $("mapDistrictFilter"),
      districts.map((v) => ({ value: v, label: v })),
      "Semua Kecamatan",
    );
    populateVillageOptions();
    populateIdOptions();
  }
  function zoomToFilteredRows() {
    if (!map || !geoLayer) return;
    const rows = filteredRows();
    if (!rows.length) return;
    const ids = new Set(rows.map((r) => r.id)), bounds = L.latLngBounds([]);
    let onlyLayer = null;
    geoLayer.eachLayer((layer) => {
      if (ids.has(idOf(layer.feature?.properties?.idsubsls))) {
        bounds.extend(layer.getBounds());
        onlyLayer = layer;
        if (rows.length > 1) onlyLayer = null;
      }
    });
    if (!bounds.isValid()) return;
    // A single Sub-SLS should be brought close; status filters focus the full matching set.
    if (rows.length === 1 && onlyLayer) {
      map.fitBounds(onlyLayer.getBounds().pad(0.35), { maxZoom: 19, animate: true });
    } else {
      map.fitBounds(bounds.pad(0.12), { maxZoom: 18, animate: true });
    }
  }
  function setTileTheme() {
    if (!map) return;
    const dark = theme() === "dark";
    const url = "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png";
    if (tileLayer) map.removeLayer(tileLayer);
    tileLayer = L.tileLayer(url, {
      subdomains: "abc",
      maxZoom: 19,
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
      className: dark ? "se2026-osm-dark" : "se2026-osm-light",
    }).addTo(map);
  }
  async function initMap() {
    if (typeof L === "undefined")
      throw new Error("Leaflet gagal dimuat. Periksa koneksi CDN.");
    const firstInit = !map;
    if (firstInit) {
      map = L.map("se2026LeafletMap", {
        preferCanvas: true,
        zoomControl: true,
        scrollWheelZoom: true,
      });
      setTileTheme();
      if (!themeObserver && "MutationObserver" in window) {
        themeObserver = new MutationObserver(() => setTileTheme());
        themeObserver.observe(document.documentElement, {
          attributes: true,
          attributeFilter: ["data-bs-theme"],
        });
      }
      $("mapDistrictFilter").addEventListener("change", () => {
        populateVillageOptions();
        $("mapVillageFilter").value = "";
        populateIdOptions();
        applyFilters();
        zoomToFilteredRows();
      });
      $("mapVillageFilter").addEventListener("change", () => {
        populateIdOptions();
        applyFilters();
        zoomToFilteredRows();
      });
      $("mapIdFilter").addEventListener("change", () => {
        const id = $("mapIdFilter").value;
        if (id) {
          $("mapSearch").value = "";
          $("mapStatusFilter").value = "";
          const row = rowById.get(id);
          if (row) {
            $("mapDistrictFilter").value = row.properties.nmkec || "";
            populateVillageOptions(row.properties.nmdesa || "");
            $("mapVillageFilter").value = row.properties.nmdesa || "";
            populateIdOptions(id);
          }
        }
        applyFilters();
        zoomToFilteredRows();
        const row = id ? rowById.get(id) : null;
        if (row) {
          selectedId = row.id;
          renderDetail(row);
          applyFilters();
        }
      });
      $("mapStatusFilter").addEventListener("change", () => {
        selectedId = null;
        selectedLayer = null;
        renderDetail(null);
        applyFilters();
        zoomToFilteredRows();
      });
      $("mapSearch").addEventListener("input", () => {
        if ($("mapSearch").value.trim()) $("mapIdFilter").value = "";
        applyFilters();
        const rows = filteredRows();
        if (rows.length === 1) zoomToFilteredRows();
      });
      $("btnMapReset").addEventListener("click", () => {
        [
          "mapDistrictFilter",
          "mapVillageFilter",
          "mapIdFilter",
          "mapStatusFilter",
          "mapSearch",
        ].forEach((id) => ($(id).value = ""));
        populateVillageOptions();
        populateIdOptions();
        selectedId = null;
        selectedLayer = null;
        renderDetail(null);
        applyFilters();
        const b = geoLayer.getBounds();
        if (b.isValid()) map.fitBounds(b.pad(0.04));
      });
      $("btnMapRefresh").addEventListener("click", refreshMap);
    }
    const bounds = L.latLngBounds([]);
    geoLayer = L.geoJSON(geojson, {
      style: (feature) => {
        const row = rowById.get(feature.properties.idsubsls);
        return row
          ? styleFor(row, selectedId === row.id)
          : {
              color: "#94a3b8",
              weight: 0.8,
              fillColor: COLORS.unmatched,
              fillOpacity: 0.7,
            };
      },
      onEachFeature: (feature, layer) => {
        const row = rowById.get(feature.properties.idsubsls);
        if (!row) return;
        layer.bindTooltip(() => tooltipHtml(row), {
          sticky: true,
          direction: "top",
          className: "map-hover-tooltip",
        });
        layer.on("mouseover", () => {
          if (selectedId !== row.id) layer.setStyle(styleFor(row, false, true));
        });
        layer.on("mouseout", () => {
          if (selectedId !== row.id) layer.setStyle(styleFor(row));
        });
        layer.on("click", () => {
          if (selectedLayer && selectedId !== row.id) {
            const old = rowById.get(selectedId);
            if (old) selectedLayer.setStyle(styleFor(old));
          }
          selectedId = row.id;
          selectedLayer = layer;
          layer.setStyle(styleFor(row, true));
          renderDetail(row);
        });
      },
    }).addTo(map);
    try {
      bounds.extend(geoLayer.getBounds());
    } catch (_) {}
    if (firstInit && bounds.isValid()) map.fitBounds(bounds.pad(0.04));
    else if (firstInit) map.setView([1.65, 101.45], 11);
    selectedLayer = null;
    if (selectedId)
      geoLayer.eachLayer((layer) => {
        if (layer.feature?.properties?.idsubsls === selectedId)
          selectedLayer = layer;
      });
  }
  async function refreshMap() {
    if (loading) return;
    loading = true;
    const btn = $("btnMapRefresh");
    if (btn) {
      btn.disabled = true;
      btn.innerHTML =
        '<span class="spinner-border spinner-border-sm me-1"></span>Memuat';
    }
    try {
      const g = await loadGeojson();
      geojson = g;
      snapshot = await loadSnapshot();
      await loadOfficers();
      featureRows = geojson.features.map((feature) =>
        aggregate(idOf(feature.properties?.idsubsls), feature.properties || {}),
      );
      rowById = new Map(featureRows.map((row) => [row.id, row]));
      populateFilters();
      if (map) {
        const center = map.getCenter(),
          zoom = map.getZoom();
        if (geoLayer) map.removeLayer(geoLayer);
        geoLayer = null;
        selectedLayer = null;
        await initMap();
        if (Number.isFinite(zoom) && zoom > 0) map.setView(center, zoom);
      } else await initMap();
      updateKpis();
      applyFilters();
      renderDetail(
        selectedId ? featureRows.find((r) => r.id === selectedId) : null,
      );
      $("mapSnapshotInfo").textContent = snapshot
        ? `PES SE2026 · Snapshot ${snapshot.importDate || "-"} · ${snapshot.uploadedAt ? new Date(snapshot.uploadedAt).toLocaleString("id-ID", { dateStyle: "medium", timeStyle: "short" }) : "waktu unggah tidak tersedia"}`
        : "PES SE2026 · Snapshot Deployment belum tersedia; geometri tetap ditampilkan.";
    } catch (err) {
      console.error("[SE2026 map]", err);
      $("mapSnapshotInfo").textContent = "Gagal memuat peta: " + err.message;
      $("mapDetailContent").innerHTML =
        `<div class="alert alert-danger small mb-0">${esc(err.message)}</div>`;
    } finally {
      loading = false;
      if (btn) {
        btn.disabled = false;
        btn.innerHTML =
          '<i class="bi bi-arrow-clockwise me-1"></i>Refresh Peta';
      }
    }
  }
  window.activateSe2026Map = async function () {
    active = true;
    if (!featureRows.length) await refreshMap();
    requestAnimationFrame(() => {
      if (map) map.invalidateSize(true);
    });
  };
  document.addEventListener("DOMContentLoaded", () => {
    if ($("mapDistributionModule")) {
      const nav = $("menuMapDistribution");
      nav?.addEventListener("click", () => window.activateSe2026Map());
    }
  });
})();

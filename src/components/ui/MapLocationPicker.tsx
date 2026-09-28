import React, { useState } from 'react';
import { MapPin, Navigation, ExternalLink, Camera, Trash2, CheckCircle2, Crosshair, AlertCircle } from 'lucide-react';
import { useToast } from '@/components/ui/Toast';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';

interface MapLocationPickerProps {
  lat: string;
  lng: string;
  address?: string;
  customerName?: string;
  idpel?: string;
  photos?: string[];
  onChangeCoords: (lat: string, lng: string) => void;
  onUpdatePhotos?: (photos: string[]) => void;
  readOnly?: boolean;
}

export const MapLocationPicker: React.FC<MapLocationPickerProps> = ({
  lat,
  lng,
  address,
  customerName,
  idpel,
  photos = [],
  onChangeCoords,
  onUpdatePhotos,
  readOnly = false,
}) => {
  const { showToast } = useToast();
  const [gpsLoading, setGpsLoading] = useState(false);
  const [gpsAccuracy, setGpsAccuracy] = useState<number | null>(null);
  const [gpsError, setGpsError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'map' | 'photos'>('map');

  // Photo Delete Dialog
  const [photoToDelete, setPhotoToDelete] = useState<number | null>(null);

  const validLat = parseFloat(lat) || -6.52414600;
  const validLng = parseFloat(lng) || 106.17685700;

  // Presets for quick simulation & fallback
  const presetLocations = [
    { name: 'ULP Rangkasbitung', lat: '-6.35728400', lng: '106.24831200' },
    { name: 'ULP Malingping', lat: '-6.79384500', lng: '105.99214700' },
    { name: 'UP3 Banten Selatan', lat: '-6.52414600', lng: '106.17685700' },
    { name: 'Gardu Trafo TM-01', lat: '-6.53120000', lng: '106.18240000' },
  ];

  // OpenStreetMap embed URL
  const osmUrl = `https://www.openstreetmap.org/export/embed.html?bbox=${validLng - 0.008}%2C${validLat - 0.006}%2C${validLng + 0.008}%2C${validLat + 0.006}&layer=mapnik&marker=${validLat}%2C${validLng}`;
  const gmapsUrl = `https://www.google.com/maps?q=${validLat},${validLng}`;

  const handleGetLiveGPS = () => {
    setGpsError(null);
    if (!navigator.geolocation) {
      setGpsError('Browser atau perangkat Anda tidak mendukung akses sensor GPS Geolocation.');
      showToast('Perangkat tidak mendukung sensor GPS Geolocation.', 'error', 'Sensor Tidak Ditemukan');
      return;
    }

    setGpsLoading(true);
    navigator.geolocation.getCurrentPosition(
      pos => {
        setGpsLoading(false);
        const newLat = pos.coords.latitude.toFixed(8);
        const newLng = pos.coords.longitude.toFixed(8);
        const acc = Math.round(pos.coords.accuracy);
        setGpsAccuracy(acc);
        setGpsError(null);
        onChangeCoords(newLat, newLng);
        showToast(`Titik GPS berhasil terbaca: ${newLat}, ${newLng} (Akurasi: ±${acc}m)`, 'success', 'GPS Terkunci');
      },
      err => {
        setGpsLoading(false);
        let msg = 'Gagal mengakses GPS.';
        if (err.code === 1) {
          msg = 'Izin lokasi browser ditolak (User denied Geolocation). Silakan aktifkan izin lokasi pada browser Anda.';
        } else if (err.code === 2) {
          msg = 'Posisi GPS tidak tersedia saat ini. Pastikan GPS/Location service perangkat aktif.';
        } else if (err.code === 3) {
          msg = 'Waktu permintaan GPS habis (Timeout). Coba klik tombol kembali.';
        }
        setGpsError(msg);
        showToast(msg, 'warning', 'Akses Lokasi Dibatasi');
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  };

  const handleApplyPreset = (pLat: string, pLng: string) => {
    setGpsError(null);
    onChangeCoords(pLat, pLng);
    showToast(`Koordinat preset diterapkan: ${pLat}, ${pLng}`, 'info', 'Preset Lokasi');
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (!files.length || !onUpdatePhotos) return;

    const newPhotos = files.map(f => f.name);
    onUpdatePhotos([...photos, ...newPhotos]);
    showToast(`${files.length} foto lokasi berhasil diunggah dengan cap geotagging.`, 'success', 'Foto Terunggah');
  };

  const handleConfirmRemovePhoto = () => {
    if (photoToDelete === null || !onUpdatePhotos) return;
    const removedName = photos[photoToDelete];
    const next = photos.filter((_, i) => i !== photoToDelete);
    onUpdatePhotos(next);
    setPhotoToDelete(null);
    showToast(`Foto "${removedName}" berhasil dihapus.`, 'info', 'Foto Dihapus');
  };

  return (
    <div className="space-y-4">
      {/* Tab Switcher */}
      <div className="flex items-center justify-between border-b border-slate-200 pb-2">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setActiveTab('map')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
              activeTab === 'map'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            <MapPin className="w-3.5 h-3.5" />
            <span>Peta & Titik Koordinat</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('photos')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
              activeTab === 'photos'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            <Camera className="w-3.5 h-3.5" />
            <span>Foto Geotagging ({photos.length})</span>
          </button>
        </div>

        <a
          href={gmapsUrl}
          target="_blank"
          rel="noreferrer"
          className="text-[11px] text-blue-600 hover:text-blue-800 font-bold flex items-center gap-1 bg-blue-50 px-2.5 py-1 rounded-lg border border-blue-200/80"
        >
          <span>Buka di Google Maps</span>
          <ExternalLink className="w-3 h-3" />
        </a>
      </div>

      {/* VIEW 1: MAPS & COORDINATES */}
      {activeTab === 'map' && (
        <div className="space-y-3">
          {/* Coordinates input controls */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-bold text-slate-600 mb-1">
                Latitude (Garis Lintang)
              </label>
              <input
                type="text"
                readOnly={readOnly}
                value={lat || ''}
                onChange={e => onChangeCoords(e.target.value, lng)}
                placeholder="Contoh: -6.52414600"
                className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-mono font-bold text-slate-800 focus:ring-2 focus:ring-blue-500 focus:outline-none bg-slate-50/50"
              />
            </div>
            <div>
              <label className="block text-[11px] font-bold text-slate-600 mb-1">
                Longitude (Garis Bujur)
              </label>
              <input
                type="text"
                readOnly={readOnly}
                value={lng || ''}
                onChange={e => onChangeCoords(lat, e.target.value)}
                placeholder="Contoh: 106.17685700"
                className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-mono font-bold text-slate-800 focus:ring-2 focus:ring-blue-500 focus:outline-none bg-slate-50/50"
              />
            </div>
          </div>

          {/* Error Banner & Permission Help */}
          {gpsError && (
            <div className="p-3.5 bg-amber-50 border border-amber-300/80 rounded-xl text-xs space-y-2">
              <div className="flex items-start gap-2 text-amber-900 font-semibold">
                <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <span>{gpsError}</span>
              </div>
              <div className="pl-6 text-[11px] text-amber-800 space-y-1">
                <p className="font-bold">Cara mengaktifkan izin lokasi di browser:</p>
                <ol className="list-decimal list-inside space-y-0.5 text-amber-900/90">
                  <li>Klik ikon <strong>Gembok / Pengaturan (Site Settings)</strong> di sebelah kiri address bar (URL).</li>
                  <li>Ubah izin <strong>Location / Lokasi</strong> menjadi <strong>&quot;Allow&quot; (Izinkan)</strong>.</li>
                  <li>Refresh atau muat ulang halaman ini.</li>
                </ol>
              </div>
            </div>
          )}

          {/* Action Button: Live GPS fetch + Quick Presets */}
          {!readOnly && (
            <div className="space-y-2">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-3 bg-blue-50/70 border border-blue-200/70 rounded-xl">
                <button
                  type="button"
                  onClick={handleGetLiveGPS}
                  disabled={gpsLoading}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-xs transition-all flex items-center justify-center gap-1.5 shrink-0"
                >
                  <Crosshair className={`w-4 h-4 ${gpsLoading ? 'animate-spin' : ''}`} />
                  <span>{gpsLoading ? 'Membaca Sensor GPS...' : '📍 Ambil Koordinat GPS Sekarang'}</span>
                </button>
                <div className="text-[11px] text-blue-900">
                  {gpsAccuracy ? (
                    <span className="font-semibold text-emerald-700 flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5" /> Akurasi GPS: ±{gpsAccuracy} meter
                    </span>
                  ) : (
                    <span className="text-slate-500">
                      Otomatis membaca sensor lokasi satelit perangkat lapangan
                    </span>
                  )}
                </div>
              </div>

              {/* Quick Preset Coordinates Buttons */}
              <div className="flex items-center gap-1.5 flex-wrap text-[11px]">
                <span className="text-slate-500 font-semibold flex items-center gap-1">
                  <Navigation className="w-3 h-3 text-blue-600" /> Preset Lokasi Cepat:
                </span>
                {presetLocations.map((p, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => handleApplyPreset(p.lat, p.lng)}
                    className="px-2.5 py-1 bg-slate-100 hover:bg-blue-100 hover:text-blue-700 text-slate-700 rounded-lg font-medium transition-colors border border-slate-200"
                  >
                    {p.name}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Interactive Map Frame */}
          <div className="relative w-full h-48 sm:h-56 rounded-2xl overflow-hidden border border-slate-200 shadow-inner bg-slate-100">
            <iframe
              title="Peta Titik Lokasi Survey"
              width="100%"
              height="100%"
              frameBorder="0"
              scrolling="no"
              marginHeight={0}
              marginWidth={0}
              src={osmUrl}
              className="w-full h-full"
            />
            
            {/* Overlay Info Tag */}
            <div className="absolute bottom-2.5 left-2.5 bg-white/95 backdrop-blur-md px-2.5 py-1.5 rounded-xl shadow-md border border-slate-200 text-xs flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-rose-500 animate-ping" />
              <div>
                <span className="font-bold text-slate-800 block text-[10px]">Pin Koordinat Terpasang:</span>
                <span className="font-mono text-[10px] text-slate-500">{validLat.toFixed(6)}, {validLng.toFixed(6)}</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* VIEW 2: GEOTAGGED PHOTOS & WATERMARK PREVIEW */}
      {activeTab === 'photos' && (
        <div className="space-y-4">
          {/* Upload Area */}
          {!readOnly && (
            <div className="p-5 border-2 border-dashed border-blue-200 bg-blue-50/30 rounded-2xl text-center">
              <Camera className="w-8 h-8 mx-auto text-blue-500 mb-1.5" />
              <div className="text-xs font-bold text-slate-800">Unggah Foto Lokasi Survey (Geotagged)</div>
              <p className="text-[11px] text-slate-500 mb-3">Foto akan otomatis dibubuhi cap koordinat GPS dan identitas pelanggan</p>
              <label className="inline-flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold cursor-pointer shadow-xs transition-all">
                <span>Pilih / Ambil Foto</span>
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handleFileUpload}
                  className="hidden"
                />
              </label>
            </div>
          )}

          {/* Photos list with Geotag Preview */}
          {photos.length === 0 ? (
            <div className="text-center py-8 text-xs text-slate-400 border border-slate-200 rounded-xl bg-slate-50">
              Belum ada foto lokasi yang diunggah.
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {photos.map((pName, idx) => (
                <div key={idx} className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs relative group">
                  {/* Mock Photo Display Area */}
                  <div className="h-40 bg-gradient-to-br from-slate-200 to-slate-300 flex items-center justify-center relative overflow-hidden">
                    <span className="text-4xl">📸</span>
                    
                    {/* Geotagging Watermark Stamp */}
                    <div className="absolute inset-x-0 bottom-0 bg-slate-900/80 backdrop-blur-sm p-2 text-white text-[10px] space-y-0.5 border-t border-white/20">
                      <div className="flex items-center justify-between font-bold">
                        <span className="text-amber-300">📍 {validLat.toFixed(6)}, {validLng.toFixed(6)}</span>
                        <span className="text-slate-300">{new Date().toLocaleDateString('id-ID')}</span>
                      </div>
                      <div className="truncate text-slate-200">
                        👤 {customerName || 'Pelanggan Baru'} {idpel ? `(${idpel})` : ''}
                      </div>
                      <div className="text-[9px] text-slate-400">
                        PLN UNIT LAYANAN PELANGGAN • PROMOTOR GEOTAG
                      </div>
                    </div>
                  </div>

                  {/* Photo Title & Delete */}
                  <div className="p-2.5 flex items-center justify-between bg-white text-xs">
                    <span className="font-semibold text-slate-700 truncate text-[11px]">{pName}</span>
                    {!readOnly && onUpdatePhotos && (
                      <button
                        type="button"
                        onClick={() => setPhotoToDelete(idx)}
                        className="text-rose-500 hover:text-rose-700 p-1 rounded-lg hover:bg-rose-50 transition-colors"
                        title="Hapus foto"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Delete Photo Confirmation */}
      <ConfirmDialog
        isOpen={photoToDelete !== null}
        onClose={() => setPhotoToDelete(null)}
        onConfirm={handleConfirmRemovePhoto}
        title="Hapus Foto Geotagging"
        message={photoToDelete !== null ? `Apakah Anda yakin ingin menghapus foto "${photos[photoToDelete]}"?` : ''}
        confirmText="Ya, Hapus Foto"
        cancelText="Batal"
      />
    </div>
  );
};

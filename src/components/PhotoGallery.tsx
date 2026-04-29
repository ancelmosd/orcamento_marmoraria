import React, { useState, useEffect } from 'react';
import { Camera, X, Plus, Trash2, Eye } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface Photo {
  id: number;
  url: string;
  description: string | null;
  created_at: string;
}

interface PhotoGalleryProps {
  quoteId: number;
  showToast: (m: string, t?: 'success' | 'error') => void;
}

export const PhotoGallery: React.FC<PhotoGalleryProps> = ({ quoteId, showToast }) => {
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedPhoto, setSelectedPhoto] = useState<Photo | null>(null);

  const fetchPhotos = async () => {
    if (!quoteId) return;
    try {
      setIsLoading(true);
      const res = await fetch(`/api/quotes/${quoteId}/photos`);
      if (res.ok) {
        const data = await res.json();
        setPhotos(Array.isArray(data) ? data : []);
      }
    } catch (e) {
      console.error("Fetch photos error:", e);
      showToast("Erro ao carregar galeria", "error");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchPhotos();
  }, [quoteId]);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 10 * 1024 * 1024) { // Aumentado limite de leitura para 10MB
      showToast("Arquivo muito grande (máx 10MB)", "error");
      return;
    }

    setIsUploading(true);
    const reader = new FileReader();
    reader.onloadend = async () => {
      try {
        const img = new Image();
        img.src = reader.result as string;
        
        img.onload = async () => {
          // Compressão com Canvas
          const canvas = document.createElement('canvas');
          const MAX_WIDTH = 1200;
          const MAX_HEIGHT = 1200;
          let width = img.width;
          let height = img.height;

          if (width > height) {
            if (width > MAX_WIDTH) {
              height *= MAX_WIDTH / width;
              width = MAX_WIDTH;
            }
          } else {
            if (height > MAX_HEIGHT) {
              width *= MAX_HEIGHT / height;
              height = MAX_HEIGHT;
            }
          }

          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          ctx?.drawImage(img, 0, 0, width, height);
          
          // Reduz qualidade para 70% em JPEG
          const compressedBase64 = canvas.toDataURL('image/jpeg', 0.7);

          const res = await fetch(`/api/quotes/${quoteId}/photos`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              url: compressedBase64,
              description: file.name
            })
          });

          if (res.ok) {
            showToast("Foto enviada com sucesso!");
            fetchPhotos();
          } else {
            showToast("Erro ao enviar foto", "error");
          }
          setIsUploading(false);
        };
        
        img.onerror = () => {
          showToast("Erro ao processar imagem", "error");
          setIsUploading(false);
        };

      } catch (err) {
        showToast("Erro na conexão", "error");
        setIsUploading(false);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Deletar esta foto?")) return;
    try {
      const res = await fetch(`/api/photos/${id}`, { method: 'DELETE' });
      if (res.ok) {
        showToast("Foto removida");
        setPhotos(photos.filter(p => p.id !== id));
      }
    } catch (e) {
      showToast("Erro ao deletar", "error");
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="font-bold flex items-center gap-2 text-slate-200">
          <Camera size={18} className="text-primary" /> Galeria do Projeto
        </h3>
        <label className="bg-primary/10 text-primary px-4 py-2 rounded-lg text-xs font-bold hover:bg-primary/20 transition-all cursor-pointer flex items-center gap-2">
          {isUploading ? 'Enviando...' : <><Plus size={14} /> Adicionar Foto</>}
          <input type="file" accept="image/*" className="hidden" onChange={handleFileUpload} disabled={isUploading} />
        </label>
      </div>

      {isLoading ? (
        <div className="py-12 text-center">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-sm text-slate-500">Carregando fotos...</p>
        </div>
      ) : photos.length === 0 ? (
        <div className="bg-white/5 border border-dashed border-border-dark p-8 rounded-xl text-center">
          <p className="text-sm text-slate-500">Nenhuma foto anexada a este projeto.</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
          {photos.map(photo => (
            <div key={photo.id} className="relative aspect-square rounded-xl overflow-hidden group border border-border-dark hover:border-primary/50 transition-all">
              <img src={photo.url} alt={photo.description || ''} className="w-full h-full object-cover" />
              <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
                <button 
                  onClick={() => setSelectedPhoto(photo)}
                  className="p-2 bg-white/10 hover:bg-white/20 rounded-full text-white transition-all transform hover:scale-110"
                >
                  <Eye size={18} />
                </button>
                <button 
                  onClick={() => handleDelete(photo.id)}
                  className="p-2 bg-red-500/20 hover:bg-red-500/40 rounded-full text-red-400 transition-all transform hover:scale-110"
                >
                  <Trash2 size={18} />
                </button>
              </div>
              <div className="absolute bottom-0 left-0 right-0 p-2 bg-gradient-to-t from-black/80 to-transparent">
                <p className="text-[10px] text-white font-medium truncate">{photo.description || 'Sem descrição'}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Fullscreen Preview Modal */}
      <AnimatePresence>
        {selectedPhoto && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[200] bg-black/95 flex items-center justify-center p-4"
            onClick={() => setSelectedPhoto(null)}
          >
            <button className="absolute top-4 right-4 p-2 text-white hover:text-primary transition-colors">
              <X size={32} />
            </button>
            <motion.img
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              src={selectedPhoto.url}
              alt="Preview"
              className="max-w-full max-h-full object-contain rounded-lg shadow-2xl"
            />
            <div className="absolute bottom-8 left-1/2 -translate-x-1/2 bg-black/50 backdrop-blur-md px-6 py-3 rounded-full border border-white/10 text-white text-center">
              <p className="font-bold">{selectedPhoto.description}</p>
              <p className="text-xs text-slate-400">Enviada em {new Date(selectedPhoto.created_at).toLocaleDateString('pt-BR')}</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

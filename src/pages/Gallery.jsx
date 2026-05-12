import { useState, useEffect } from 'react';
import { Upload, Trash2, X, Check } from 'lucide-react';
import { collection, addDoc, getDocs, deleteDoc, doc, query, orderBy } from 'firebase/firestore';
import { db } from '../firebase';
import '../pages/Gallery.css';
import Modal from '../components/Modal';

const Gallery = () => {
  const [images, setImages] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [loading, setLoading] = useState(true);
  const [selectedImage, setSelectedImage] = useState(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

  // Load images from Firestore (no CORS issues)
  useEffect(() => {
    loadImages();
  }, []);

  const loadImages = async () => {
    try {
      setLoading(true);
      const galleryRef = collection(db, 'gallery');
      const q = query(galleryRef, orderBy('uploadedAt', 'desc'));
      const snapshot = await getDocs(q);
      
      const imageList = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      
      setImages(imageList);
    } catch (err) {
      console.error('Error loading images:', err);
      setError('Failed to load gallery images');
    } finally {
      setLoading(false);
    }
  };

  const handleFileSelect = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      setError('Please select an image file');
      return;
    }

    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      setError('File size must be less than 5MB');
      return;
    }

    await uploadImage(file);
  };

  const uploadImage = async (file) => {
    try {
      setUploading(true);
      setError('');
      // Read file as data URL and save to Firestore (dev fallback)
      const dataUrl = await new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.onerror = (e) => reject(e);
        reader.readAsDataURL(file);
      });

      const galleryRef = collection(db, 'gallery');
      await addDoc(galleryRef, {
        name: file.name,
        dataUrl: dataUrl,
        uploadedAt: new Date(),
        fileSize: file.size,
        fileType: file.type
      });
      
      setSuccess('Image uploaded successfully!');
      
      // Reload gallery
      await loadImages();
      
      // Clear success message after 2 seconds
      setTimeout(() => setSuccess(''), 2000);
    } catch (err) {
      console.error('Upload error:', err);
      setError('Failed to upload image');
    } finally {
      setUploading(false);
    }
  };

  const deleteImage = async (image) => {
    // Open custom confirm modal instead of browser confirm
    setConfirmDelete({ open: true, image });
  };

  const performDelete = async (image) => {
    try {
      await deleteDoc(doc(db, 'gallery', image.id));
      setSuccess('Image deleted successfully!');
      // close confirm modal
      setConfirmDelete({ open: false, image: null });
      // if this image was open in preview, close it
      if (selectedImage && selectedImage.id === image.id) setSelectedImage(null);
      await loadImages();
      setTimeout(() => setSuccess(''), 2000);
    } catch (err) {
      console.error('Delete error:', err);
      setError('Failed to delete image');
      setConfirmDelete({ open: false, image: null });
    }
  };

  const [confirmDelete, setConfirmDelete] = useState({ open: false, image: null });

  return (
    <div className="page-container">
      <div style={{ marginBottom: '2rem' }}>
        <h1>Photo Gallery</h1>
        <p style={{ color: 'var(--text-secondary)', marginTop: '0.5rem' }}>
          Upload and manage photos of friends, cricket ground, and memorable moments
        </p>
      </div>

      {/* Upload Section */}
      <div className="glass-card" style={{ marginBottom: '2rem', padding: '2rem' }}>
        <div className="upload-area">
          <label htmlFor="file-input" style={{ cursor: 'pointer', display: 'block', width: '100%' }}>
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '1rem',
              padding: '2rem',
              border: '2px dashed var(--border-color)',
              borderRadius: 'var(--radius-lg)',
              textAlign: 'center',
              transition: 'border-color var(--transition-fast)',
              cursor: 'pointer'
            }}>
              <Upload size={32} color="var(--primary-color)" />
              <div>
                <p style={{ fontSize: '1rem', fontWeight: 500 }}>
                  {uploading ? 'Uploading...' : 'Click to upload or drag and drop'}
                </p>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>
                  PNG, JPG, GIF or WEBP (Max 5MB)
                </p>
              </div>
            </div>
          </label>
          <input
            id="file-input"
            type="file"
            accept="image/*"
            onChange={handleFileSelect}
            disabled={uploading}
            style={{ display: 'none' }}
          />
        </div>
      </div>

      {/* Messages */}
      {error && (
        <div style={{
          padding: '1rem',
          background: 'var(--danger-bg)',
          border: '1px solid rgba(239, 68, 68, 0.2)',
          borderRadius: 'var(--radius-md)',
          color: 'var(--danger-color)',
          marginBottom: '1rem',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <span>{error}</span>
          <X size={20} onClick={() => setError('')} style={{ cursor: 'pointer' }} />
        </div>
      )}

      {success && (
        <div style={{
          padding: '1rem',
          background: 'var(--success-bg)',
          border: '1px solid rgba(16, 185, 129, 0.2)',
          borderRadius: 'var(--radius-md)',
          color: 'var(--success-color)',
          marginBottom: '1rem',
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem'
        }}>
          <Check size={20} />
          <span>{success}</span>
        </div>
      )}

      {/* Gallery Grid */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '2rem' }}>
          <p style={{ color: 'var(--text-secondary)' }}>Loading gallery...</p>
        </div>
      ) : images.length === 0 ? (
        <div className="glass-card" style={{ textAlign: 'center', padding: '3rem' }}>
          <p style={{ color: 'var(--text-secondary)', marginBottom: '1rem' }}>
            No images yet. Upload your first photo to get started!
          </p>
        </div>
      ) : (
        <div className="gallery-grid">
              {images.map((image) => (
                <GalleryCard
                  key={image.id}
                  image={image}
                  onDelete={() => deleteImage(image)}
                  onView={() => setSelectedImage(image)}
                />
              ))}
        </div>
      )}

      {/* Image Preview Modal */}
      {selectedImage && (
        <ImagePreviewModal
          image={selectedImage}
          onClose={() => setSelectedImage(null)}
          onDelete={() => setConfirmDelete({ open: true, image: selectedImage })}
        />
      )}

      {/* Custom delete confirmation modal */}
      <Modal
        isOpen={confirmDelete.open}
        onClose={() => setConfirmDelete({ open: false, image: null })}
        title="Confirm Delete"
      >
        {confirmDelete.image && (
          <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
            <div style={{ flex: '0 0 120px' }}>
              <img src={confirmDelete.image.dataUrl || confirmDelete.image.downloadUrl} alt={confirmDelete.image.name} style={{ width: '120px', height: '80px', objectFit: 'cover', borderRadius: '6px' }} />
            </div>
            <div style={{ flex: '1 1 auto' }}>
              <p style={{ margin: 0, fontWeight: 600 }}>{confirmDelete.image.name}</p>
              <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: '0.9rem' }}>{(confirmDelete.image.fileSize ? Math.round(confirmDelete.image.fileSize/1024) + ' KB' : '')}</p>
              <div style={{ marginTop: '0.75rem', display: 'flex', gap: '0.5rem' }}>
                <button onClick={() => setConfirmDelete({ open: false, image: null })} className="btn btn-outline">Cancel</button>
                <button onClick={() => performDelete(confirmDelete.image)} style={{ background: 'var(--danger-color)', color: 'white', border: 'none', padding: '0.5rem 1rem', borderRadius: '6px', cursor: 'pointer' }}>Delete</button>
              </div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

const GalleryCard = ({ image, onDelete, onView }) => {
  const [thumbnail, setThumbnail] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Image stored in Firestore as dataUrl (dev fallback) or has downloadUrl
    const url = image.downloadUrl || image.dataUrl || null;
    setThumbnail(url);
    setLoading(false);
  }, [image]);

  return (
    <div className="gallery-card" onClick={onView} style={{ cursor: 'pointer' }}>
      {loading ? (
        <div style={{
          width: '100%',
          height: '100%',
          background: 'rgba(0,0,0,0.1)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          borderRadius: 'var(--radius-md)'
        }}>
          <span style={{ color: 'var(--text-secondary)' }}>Loading...</span>
        </div>
      ) : thumbnail ? (
        <img src={thumbnail} alt={image.name} style={{
          width: '100%',
          height: '100%',
          objectFit: 'cover',
          borderRadius: 'var(--radius-md)'
        }} />
      ) : (
        <div style={{
          width: '100%',
          height: '100%',
          background: 'rgba(0,0,0,0.1)',
          borderRadius: 'var(--radius-md)'
        }} />
      )}
      
      <button
        onClick={(e) => {
          e.stopPropagation();
          onDelete();
        }}
        style={{
          position: 'absolute',
          top: '0.5rem',
          right: '0.5rem',
          background: 'rgba(0,0,0,0.6)',
          border: 'none',
          borderRadius: '50%',
          padding: '0.5rem',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          opacity: 0,
          transition: 'opacity var(--transition-fast)'
        }}
        className="gallery-card-delete"
      >
        <Trash2 size={18} color="white" />
      </button>
    </div>
  );
};

const ImagePreviewModal = ({ image, onClose, onDelete }) => {
  const [imageUrl, setImageUrl] = useState(null);
  const [loading, setLoading] = useState(true);
  const [natural, setNatural] = useState({ w: 0, h: 0 });

  useEffect(() => {
    const url = image?.downloadUrl || image?.dataUrl || null;
    setImageUrl(url);
    setNatural({ w: 0, h: 0 });
    setLoading(false);
  }, [image]);

  if (!image) return null;

  return (
    <div className="gallery-modal-overlay" onClick={onClose}>
      <div className="gallery-modal-content" onClick={(e) => e.stopPropagation()}>
        <button
          onClick={onClose}
          style={{
            position: 'absolute',
            top: '0.75rem',
            right: '0.75rem',
            background: 'transparent',
            border: 'none',
            color: 'white',
            cursor: 'pointer',
            zIndex: 10,
            fontSize: '1.25rem'
          }}
          aria-label="Close preview"
        >
          ✕
        </button>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '2rem' }}>
            <p style={{ color: 'white' }}>Loading...</p>
          </div>
        ) : imageUrl ? (
          <>
            <div className="gallery-modal-body">
              <img
                src={imageUrl}
                alt={image.name}
                onLoad={(e) => setNatural({ w: e.target.naturalWidth, h: e.target.naturalHeight })}
              />
            </div>

            <div className="gallery-modal-footer">
              <button
                onClick={onClose}
                className="btn btn-outline"
                style={{ minWidth: '100px' }}
              >
                Close
              </button>
              <button
                onClick={onDelete}
                style={{
                  background: 'var(--danger-color)',
                  color: 'white',
                  border: 'none',
                  padding: '0.75rem 1.25rem',
                  borderRadius: 'var(--radius-md)',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  fontSize: '0.95rem',
                  fontWeight: 500
                }}
              >
                <Trash2 size={18} />
                Delete
              </button>
            </div>
          </>
        ) : null}
      </div>
    </div>
  );
};

export default Gallery;

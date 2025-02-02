import { SessionProvider } from '@hono/auth-js/react';
import { useCallback, useEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { Header } from './components/header';

function App() {
  const [files, setFiles] = useState<FileList | null>(null);
  const [imageUrls, setImageUrls] = useState<string[]>([]);

  const fetchImageUrls = useCallback(async () => {
    try {
      const response = await fetch('/api/admin/images');
      if (!response.ok) {
        throw new Error('Failed to fetch image URLs');
      }
      const urls: string[] = await response.json();
      setImageUrls(urls);
    } catch (error) {
      console.error('Error fetching image URLs:', error);
    }
  }, []);

  useEffect(() => {
    fetchImageUrls();
  }, [fetchImageUrls]);


  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    setFiles(event.target.files);
  }
  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!files || files.length === 0) {
      console.error('No files selected');
      return;
    }

    try {
      const uploadPromises = Array.from(files).map(async (file) => {
        try {
          const presignedUrlResponse = await fetch('/api/admin/get-presigned-url');

          if (!presignedUrlResponse.ok) {
            throw new Error('Failed to fetch presigned URL');
          }

          const { url, key }: { url: string; key: string } = await presignedUrlResponse.json();

          const uploadResponse: Response = await fetch(url, {
            method: 'PUT',
            body: file,
            headers: {
              'Content-Type': file.type,
            },
          });

          if (uploadResponse.ok) {
            console.log(`File ${file.name} uploaded successfully!`);

            const completeResponse: Response = await fetch('/api/admin/upload-complete', {
              method: 'POST',
              body: JSON.stringify({ key: key }),
              headers: {
                'Content-Type': 'application/json',
              },
            });

            if (completeResponse.ok) {
              console.log('Upload completion notified.');
              // アップロード完了後に画像リストを再fetch
              fetchImageUrls();
            } else {
              console.error('Failed to notify upload completion.');
            }
          } else {
            throw new Error(`Failed to upload file ${file.name}`);
          }
        } catch (error) {
          console.error(`Error uploading file ${file.name}:`, error);
        }
      });

      // すべてのアップロードが完了するのを待つ
      await Promise.all(uploadPromises);
      console.log('All files uploaded successfully');
    } catch (error) {
      console.error('Error in handleSubmit:', error);
    }
  };


  return (
    <SessionProvider>
      <Header />
      <h1>Welcome Admin!</h1>
      <form onSubmit={handleSubmit}>
        <input type="file" multiple accept="image/*" onChange={handleFileChange}  />
        <button type="submit">Upload</button>
      </form>

      <h2>Image Gallery</h2>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '10px' }}>
        {imageUrls.map((url, index) => (
          <img key={url} src={url} alt={`Gallery ${index + 1}`} style={{ maxWidth: '100%', height: 'auto' }} />
        ))}
      </div>
    </SessionProvider>
  );
}

const domNode = document.getElementById('root')
if (domNode) {
  const root = createRoot(domNode)
  root.render(<App />)
} else {
  console.error('Failed to find the root element')
}

import { ref, onMounted, watch } from 'vue';
import { Plugins, CameraResultType, CameraSource, CameraPhoto, Capacitor, FilesystemDirectory } from '@capacitor/core';

export function usePhotoGallery() {
    const { Camera, Filesystem, Storage } = Plugins;
    // Reactive array for storing photos
    const photos = ref<Photo[]>([]);
    const PHOTO_STORAGE = 'photos';

    // Save photos array as JSON to file storage
    const cachePhotos = () => {
        Storage.set({
            key: PHOTO_STORAGE,
            value: JSON.stringify(photos.value)
        });
    }; 

    // Watch for changes of the photos
    watch(photos, cachePhotos);

    // Retrieve the data when tab loads
    const loadSaved = async () => {
        const photoList = await Storage.get({ key: PHOTO_STORAGE });
        const photosInStorage = photoList.value ? JSON.parse(photoList.value) : [];

        for (const photo of photosInStorage) {
            const file = await Filesystem.readFile({
                path: photo.filepath,
                directory: FilesystemDirectory.Data
            });
            photo.webviewPath = `data:image/jpeg;base64,${file.data}`;
        }
        photos.value = photosInStorage;
    };

    // Convert blob photo to base64
    const convertBlobToBase64 = (blob: Blob) => new Promise((resolve, reject) => {
        const reader = new FileReader;
        reader.onerror = reject;
        reader.onload = () => {
            resolve(reader.result);
        };
        reader.readAsDataURL(blob);
    });

    // Save photo to Filesystem
    const savePicture = async (photo: CameraPhoto, fileName: string): Promise<Photo> => {
        // Fetch the photo, read as blob, convert to base64 format
        const response = await fetch(photo.webPath!);
        const blob = await response.blob();
        const base64Data = await convertBlobToBase64(blob) as string;

        const savedFile = await Filesystem.writeFile({
            path: fileName,
            data: base64Data,
            directory: FilesystemDirectory.Data
        });
        
        // Using webPath to display the new image instead of base64 since it's already loaded into memory
        return {
            filepath: fileName,
            webviewPath: photo.webPath
        };
    };

    // Take photo functionality
    const takePhoto = async () => {
        // Get taken photo
        const cameraPhoto = await Camera.getPhoto({
            resultType: CameraResultType.Uri,
            source: CameraSource.Camera,
            quality: 100
        });
        
        // Save taken photo to the array
        const fileName = new Date().getTime() + '.jpeg';
        const savedFileImage = await savePicture(cameraPhoto, fileName);
        photos.value = [savedFileImage, ...photos.value];
    };

    // Call loadSaved method on page/tab load
    onMounted(loadSaved);

    return {
        photos,
        takePhoto
    };
}

export interface Photo {
    filepath: string;
    webviewPath?: string;
}
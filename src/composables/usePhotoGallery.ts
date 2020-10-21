import { ref, onMounted, watch } from 'vue';
import { Plugins, CameraResultType, CameraSource, CameraPhoto, Capacitor, FilesystemDirectory } from '@capacitor/core';

// Reactive array for storing photos
const photos = ref<Photo[]>([]);

export function usePhotoGallery() {
    const { Camera } = Plugins;

    const takePhoto = async () => {
        // Get taken photo
        const cameraPhoto = await Camera.getPhoto({
            resultType: CameraResultType.Uri,
            source: CameraSource.Camera,
            quality: 100
        });
        
        // Save taken photo to the array
        const fileName = new Date().getTime() + '.jpeg';
        const savedFileImage = {
            filepath: fileName,
            webviewPath: cameraPhoto.webPath
        };
        photos.value = [savedFileImage, ...photos.value];
    };

    return {
        photos,
        takePhoto
    };
}

export interface Photo {
    filepath: string;
    webviewPath?: string;
}
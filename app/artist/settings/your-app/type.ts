export interface LocationData {
    id?: string;
    address: string;
    placeId: string;
    coordinates: {
        latitude: number;
        longitude: number;
    };
    isMainStudio: boolean;
}

export interface BrandingDataProps {
    fullName: string;
    studioName: string;
    bookingLink: string;
    location: LocationData | undefined;
    socialMediaHandle: string;
    profilePhoto: string;
    avatar: string;
    watermarkEnabled: boolean;
    watermarkImage: string;
    watermarkText: string;
    watermarkPosition: string;
    watermarkOpacity: number;
    welcomeScreenEnabled: boolean;
}

export const placementOptions = [
    { value: 'center', label: 'Center' },
    { value: 'top-left', label: 'Top Left' },
    { value: 'top-right', label: 'Top Right' },
    { value: 'bottom-left', label: 'Bottom Left' },
    { value: 'bottom-right', label: 'Bottom Right' },
]

export const opacityOptions = [
    { value: '10', label: '10%' },
    { value: '20', label: '20%' },
    { value: '30', label: '30%' },
    { value: '40', label: '40%' },
    { value: '50', label: '50%' },
    { value: '60', label: '60%' },
    { value: '70', label: '70%' },
    { value: '80', label: '80%' },
    { value: '90', label: '90%' },
    { value: '100', label: '100%' },
]
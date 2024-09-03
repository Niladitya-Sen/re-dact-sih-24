import { createSlice, PayloadAction } from '@reduxjs/toolkit'

// Define a type for the slice state
type ImageState = {
    image?: File
};

// Define the initial state using that type
const initialState: ImageState = {};

export const imageSlice = createSlice({
    name: 'pdf',
    // `createSlice` will infer the state type from the `initialState` argument
    initialState,
    reducers: {
        setImage: (state: ImageState, action: PayloadAction<ImageState>) => {
            return { ...action.payload };
        },
        removeImage: () => {
            return {};
        }
    },
})

export const { setImage, removeImage } = imageSlice.actions

export default imageSlice.reducer
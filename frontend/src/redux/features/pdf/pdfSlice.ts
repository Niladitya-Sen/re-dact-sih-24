import { createSlice, PayloadAction } from '@reduxjs/toolkit'

// Define a type for the slice state
type PDFState =  {
    preview?: string;
    redacted?: string;
};

// Define the initial state using that type
const initialState: PDFState = {};

export const pdfSlice = createSlice({
    name: 'pdf',
    // `createSlice` will infer the state type from the `initialState` argument
    initialState,
    reducers: {
        setPdf: (state: PDFState, action: PayloadAction<PDFState>) => {
            return { ...action.payload };
        },
        removePdf: () => { 
            return {};
        }
    },
})

export const { setPdf, removePdf } = pdfSlice.actions

export default pdfSlice.reducer
import { configureStore } from "@reduxjs/toolkit";
import pdfReducer from "../features/pdf/pdfSlice";
import imageReducer from "../features/image/imageSlice";

export const store = configureStore({
    reducer: {
        pdf: pdfReducer,
        image: imageReducer
    },
    middleware: (getDefaultMiddleware) => getDefaultMiddleware({
        serializableCheck: {
            // Ignore these action types
            ignoredActions: ['pdf/setPdf', 'image/setImage'],

            // Ignore these field paths in all actions
            ignoredActionPaths: ['payload.file', 'payload.image'],

            // Ignore these paths in the state
            ignoredPaths: ['pdf.pdf', 'image.image'],
        },
    }),
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
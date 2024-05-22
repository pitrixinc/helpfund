import "@/styles/globals.css";
import { AppContextProvider } from "../contexts/AppContext"
import React, { useEffect, useState } from 'react';
import 'keen-slider/keen-slider.min.css';

export default function App({ Component, pageProps }) {
  return (
  <AppContextProvider>
    <Component {...pageProps} />
  </AppContextProvider>
  );
}

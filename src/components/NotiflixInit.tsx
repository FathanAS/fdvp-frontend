"use client";

import { useEffect } from "react";
import Notiflix from "notiflix";

export default function NotiflixInit() {
    useEffect(() => {
        Notiflix.Confirm.init({
            className: 'notiflix-confirm',
            width: '320px',
            zindex: 9999,
            position: 'center', // 'center' - 'center-top' - 'right-top' - 'right-bottom' - 'left-top' - 'left-bottom' - 'center-bottom' - 'right-center' - 'left-center'
            distance: '10px',
            backgroundColor: '#161616',
            borderRadius: '12px',
            backOverlay: true,
            backOverlayColor: 'rgba(0,0,0,0.8)',
            rtl: false,
            fontFamily: 'inherit',
            cssAnimation: true,
            cssAnimationDuration: 300,
            cssAnimationStyle: 'zoom', // 'zoom' - 'fade'
            plainText: true,

            titleColor: '#14FFEC',
            titleFontSize: '16px',
            titleMaxLength: 34,

            messageColor: '#cccccc',
            messageFontSize: '14px',
            messageMaxLength: 110,

            buttonsFontSize: '14px',
            buttonsMaxLength: 34,
            okButtonColor: '#000000',
            okButtonBackground: '#14FFEC',
            cancelButtonColor: '#ffffff',
            cancelButtonBackground: '#333333',
        });
    }, []);

    return null;
}

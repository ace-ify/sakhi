import React from "react";
import type { SVGProps } from "react";

export interface Iphone16ProProps extends SVGProps<SVGSVGElement> {
  width?: number;
  height?: number;
  src?: string;
  children?: React.ReactNode;
}

export function Iphone16Pro({
  width = 420,
  height = 840,
  src,
  children,
  className = "",
  ...props
}: Iphone16ProProps) {
  // If children are provided, wrap the interactive app inside the authentic iPhone 16 Pro hardware chassis
  if (children) {
    return (
      <div
        className={`relative mx-auto flex items-center justify-center select-none w-full h-[100dvh] sm:h-auto sm:max-h-[92vh] sm:max-w-[420px] sm:aspect-[200/400] ${className}`}
      >
        {/* Physical Titanium Hardware Chassis SVG Frame (Overlays on desktop with pointer-events-none) */}
        <svg
          viewBox="0 0 200 400"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="pointer-events-none hidden sm:block absolute inset-0 z-40 h-full w-full drop-shadow-[0_25px_70px_rgba(0,0,0,0.9)]"
          aria-hidden="true"
          {...props}
        >
          {/* Outer Titanium Chassis & Hardware Side Buttons (Volume & Action Button on left, Power on right) */}
          <path
            fill="#303333"
            d="M196.11,128.09c0-.25-.2-.45-.45-.45-.11.04-.37.03-.69,0V36.69c0-17.84-14.46-32.31-32.31-32.31H37.48C19.63,4.39,5.17,18.85,5.17,36.69v48.99c-.3.02-.55.03-.66-.02-.25,0-.45.2-.45.45,0,0,0,17.29,0,17.29-.03.41.5.49,1.11.48v13.63c-.61,0-1.14.08-1.11.48,0,0,0,28.54,0,28.54-.03.42.5.49,1.11.48v7.95c-.61,0-1.14.08-1.11.48,0,0,0,28.54,0,28.54-.03.42.5.49,1.11.48v178.86c0,17.84,14.46,32.31,32.31,32.31h125.2c17.84,0,32.31-14.46,32.31-32.31v-188.87c.32-.02.58-.03.69.04,1.26.1.03-45.94.45-46.38ZM186.07,362.63c0,13.56-10.99,24.56-24.56,24.56H38.64c-13.56,0-24.56-10.99-24.56-24.56V37.37c0-13.56,10.99-24.56,24.56-24.56h122.87c13.56,0,24.56,10.99,24.56,24.56v325.26Z"
          />
          {/* Inner OLED Bezel */}
          <path
            fill="#000000"
            d="M161.38,7.29H38.78c-16.54,0-29.95,13.41-29.95,29.95v325.52c0,16.54,13.41,29.95,29.95,29.95h122.6c16.54,0,29.95-13.41,29.95-29.95V37.24c0-16.54-13.41-29.95-29.95-29.95ZM186.07,362.57c0,13.6-11.02,24.62-24.62,24.62H38.7c-13.6,0-24.62-11.02-24.62-24.62V37.43c0-13.6,11.02-24.62,24.62-24.62h122.75c13.6,0,24.62,11.02,24.62,24.62v325.14Z"
          />
          {/* Hardware Dynamic Island Cutout */}
          <path
            fill="#000000"
            d="M119.61,33.86h-38.93c-10.48-.18-10.5-15.78,0-15.96,0,0,38.93,0,38.93,0,4.41,0,7.98,3.57,7.98,7.98,0,4.41-3.57,7.98-7.98,7.98Z"
          />
          {/* TrueDepth Camera Aperture */}
          <path
            fill="#080d4c"
            d="M118.78,29.21c-4.32.06-4.32-6.73,0-6.66,4.32-.06,4.32,6.73,0,6.66Z"
          />
        </svg>

        {/* Interactive App Screen Container: Full viewport on mobile, OLED coords on desktop */}
        <div
          className="relative sm:absolute inset-0 sm:inset-[3.2%_7.04%_3.2%_7.04%] z-10 flex h-full w-full flex-col overflow-hidden sm:rounded-[34px]"
        >
          {children}
        </div>
      </div>
    );
  }

  // Standalone SVG rendition (per original spec)
  return (
    <svg
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      {...props}
    >
      <path
        fill="#303333"
        d="M196.11,128.09c0-.25-.2-.45-.45-.45-.11.04-.37.03-.69,0V36.69c0-17.84-14.46-32.31-32.31-32.31H37.48C19.63,4.39,5.17,18.85,5.17,36.69v48.99c-.3.02-.55.03-.66-.02-.25,0-.45.2-.45.45,0,0,0,17.29,0,17.29-.03.41.5.49,1.11.48v13.63c-.61,0-1.14.08-1.11.48,0,0,0,28.54,0,28.54-.03.42.5.49,1.11.48v7.95c-.61,0-1.14.08-1.11.48,0,0,0,28.54,0,28.54-.03.42.5.49,1.11.48v178.86c0,17.84,14.46,32.31,32.31,32.31h125.2c17.84,0,32.31-14.46,32.31-32.31v-188.87c.32-.02.58-.03.69.04,1.26.1.03-45.94.45-46.38ZM186.07,362.63c0,13.56-10.99,24.56-24.56,24.56H38.64c-13.56,0-24.56-10.99-24.56-24.56V37.37c0-13.56,10.99-24.56,24.56-24.56h122.87c13.56,0,24.56,10.99,24.56,24.56v325.26Z"
      />
      <path
        fill="#000000"
        d="M161.38,7.29H38.78c-16.54,0-29.95,13.41-29.95,29.95v325.52c0,16.54,13.41,29.95,29.95,29.95h122.6c16.54,0,29.95-13.41,29.95-29.95V37.24c0-16.54-13.41-29.95-29.95-29.95ZM186.07,362.57c0,13.6-11.02,24.62-24.62,24.62H38.7c-13.6,0-24.62-11.02-24.62-24.62V37.43c0-13.6,11.02-24.62,24.62-24.62h122.75c13.6,0,24.62,11.02,24.62,24.62v325.14Z"
      />

      <rect
        fill="currentColor"
        x="14.08"
        y="12.81"
        width="171.98"
        height="374.37"
        rx="24.62"
        ry="24.62"
      />
      {src && (
        <image
          href={src}
          x="14.08"
          y="12.81"
          width="171.98"
          height="374.37"
          rx="24.62"
          ry="24.62"
          preserveAspectRatio="xMidYMid slice"
          clipPath="url(#roundedCorners)"
        />
      )}
      <path
        fill="#000000"
        d="M119.61,33.86h-38.93c-10.48-.18-10.5-15.78,0-15.96,0,0,38.93,0,38.93,0,4.41,0,7.98,3.57,7.98,7.98,0,4.41-3.57,7.98-7.98,7.98Z"
      />
      <path
        fill="#080d4c"
        d="M118.78,29.21c-4.32.06-4.32-6.73,0-6.66,4.32-.06,4.32,6.73,0,6.66Z"
      />

      <defs>
        <clipPath id="roundedCorners">
          <rect
            fill="#ffffff"
            x="14.08"
            y="12.81"
            width="171.98"
            height="374.37"
            rx="24.62"
            ry="24.62"
          />
        </clipPath>
      </defs>
    </svg>
  );
}

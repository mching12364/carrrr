import React from 'react';

export default function Header() {
  return (
    <header className="flex flex-col items-center justify-center py-6">
      <h1 className="text-4xl md:text-5xl font-bold text-center">
        <span className="gradient-text">Car</span>
        <span> Identifier</span>
      </h1>
      <p className="text-slate-600 mt-2 text-center max-w-2xl">
        Upload an image of any car and get detailed specifications instantly
      </p>
    </header>
  );
}
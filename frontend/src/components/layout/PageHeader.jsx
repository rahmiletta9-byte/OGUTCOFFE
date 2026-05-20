import React from 'react';

export default function PageHeader({ title, subtitle, titleClassName = "text-3xl font-black text-foreground tracking-tight uppercase" }) {
  return (
    <div>
      <h1 className={titleClassName}>{title}</h1>
      <p className="text-muted-foreground text-sm font-bold uppercase tracking-widest opacity-60 mt-1">{subtitle}</p>
    </div>
  );
}

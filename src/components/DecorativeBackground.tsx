export const DecorativeBackground = () => {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {/* Top left blue curve */}
      <div className="absolute -top-40 -left-40 w-96 h-96 bg-primary/20 rounded-full blur-3xl" />
      
      {/* Top right purple curve */}
      <div className="absolute -top-20 -right-40 w-[600px] h-96 bg-accent/20 rounded-full blur-3xl" />
      
      {/* Bottom left blue curve */}
      <div className="absolute -bottom-40 -left-20 w-[500px] h-96 bg-primary/30 rounded-full blur-3xl" />
      
      {/* Bottom right purple curve */}
      <div className="absolute -bottom-20 right-0 w-96 h-96 bg-accent/25 rounded-full blur-3xl" />
      
      {/* Center decorative circles */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 flex gap-8 opacity-80">
        <div className="w-64 h-64 bg-primary/40 rounded-full blur-2xl" />
        <div className="w-48 h-48 bg-accent/50 rounded-full blur-2xl mt-20" />
      </div>
    </div>
  );
};

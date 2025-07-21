const HelloWorld = () => {
  return (
    <div className="flex flex-col items-center justify-center h-full">
      <h1 className="text-4xl font-bold text-foreground mb-4">
        Hello World!
      </h1>
      <p className="text-lg text-muted-foreground">
        Welcome to State View - your app is now running!
      </p>
    </div>
  );
};

export default HelloWorld;
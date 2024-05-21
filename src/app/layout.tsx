import "./globals.css";

export const metadata = {
  title: "Anisong Vocab Guesser!",
  description: "Guess the vocab from the Anisong！",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <div className="bg-white flex flex-row justify-center w-full">
          <div className="bg-white w-full max-w-screen-xl relative main-container">
            <div className="absolute w-[1440px] h-[164px] top-0 left-0 bg-white bg-opacity-100">
              <header className="w-full h-[164px] bg-white flex items-center px-8">
                <h1 className="text-black text-4xl font-medium">Anisong Vocab Guesser!</h1>
              </header>
            </div>
            {children}
          </div>
        </div>
      </body>
    </html>
  );
}

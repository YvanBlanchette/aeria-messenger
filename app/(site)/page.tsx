import Image from "next/image";

import AuthForm from "./components/auth-form";

export default function Home() {
  return (
    <div className="flex min-h-full flex-col justify-center py-12 sm:px-6 lg:px-8 bg-gray-100">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <Image
          src="/images/aeria-messenger_logo.svg"
          alt="logo"
          height={30}
          width={30}
          className="mx-auto h-14 w-auto"
        />
      </div>

      <AuthForm />
    </div>
  );
}

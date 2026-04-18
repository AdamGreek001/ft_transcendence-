import React from "react";
import Image from "next/image";
import Link from "next/link";

interface NavbarProps {
  buttonText: string;
  paragraph: string;
}

const Navbar = ({ buttonText, paragraph }: NavbarProps) => {
  const isLoginAction = buttonText.toLowerCase().includes("log");
  const href = isLoginAction ? "/Login" : "/Sign";

  return (
    <nav className="flex justify-between items-center w-[90%] mx-auto py-3 flex-wrap gap-2">
      <div className="flex justify-center items-center flex-row gap-1.5">
        <Image src="/logo.png" width={30} height={30} alt="logo" />
        <h1>StitchSocial</h1>
      </div>
      <div className="flex justify-center items-center flex-row gap-1.5 flex-wrap sm:flex-nowrap">
        <p className="text-center text-xs sm:text-sm text-gray-400">{paragraph}</p>
        <Link
          href={href}
          className="bg-purple-600 hover:bg-purple-700 p-2 rounded-lg min-w-20 text-white text-center font-bold"
        >
          {buttonText}
        </Link>
      </div>
    </nav>
  );
};

export default Navbar;

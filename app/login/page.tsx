import LoginPage from "./login.client";
import { Metadata } from "next";

export const metadata:Metadata ={
  title: "Login|XolaCloud",
description: "Experience the future of restaurant management with XolaCloud. The most intuitive POS system for cafes and restaurants in Kathmandu. Streamline your operations today.",
keywords: ["Restaurant POS Kathmandu", "Cafe Management System Nepal", "XolaCloud", "Coffee Shop POS", "Restaurant Software Nepal,pos, login"],
authors: [{ name: "XolaCloud Team" }],
creator: "XolaCloud",
publisher: "XolaCloud",
openGraph: {
  title: "XolaCloud | Premium Restaurant & Cafe POS System in Kathmandu",
  description: "Streamline your restaurant operations with XolaCloud POS. Built for the modern culinary experience.",

  url: "https://xolacloud.com",
  siteName: "XolaCloud",
  images: [
    {
      url: "/Logo.jpeg",
      width: 800,
      height: 600,
      alt: "XolaCloud Logo",
    },
  ],
  locale: "en_US",
  type: "website",
},
icons: {
  icon: [
    {
      url: "/Logo.jpeg",
      href: "/Logo.jpeg",
    },
  ],
  shortcut: "/Logo.jpeg",
  apple: "/Logo.jpeg",
},
}

export default function Login(){

  return (
    <>
    <LoginPage/>
    </>
  )
}
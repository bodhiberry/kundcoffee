import LoginPage from "./login.client";
import { Metadata } from "next";

export const metadata:Metadata ={
  title: "Login|Bodhiberry",
description: "Experience the future of restaurant management with Bodhiberry. The most intuitive POS system for cafes and restaurants in Kathmandu. Streamline your operations today.",
keywords: ["Restaurant POS Kathmandu", "Cafe Management System Nepal", "Bodhiberry", "Coffee Shop POS", "Restaurant Software Nepal,pos, login"],
authors: [{ name: "Bodhiberry Team" }],
creator: "Bodhiberry",
publisher: "Bodhiberry",
openGraph: {
  title: "Bodhiberry | Premium Restaurant & Cafe POS System in Kathmandu",
  description: "Streamline your restaurant operations with Bodhiberry POS. Built for the modern culinary experience.",

  url: "https://bodhiberry.com",
  siteName: "Bodhiberry",
  images: [
    {
      url: "/Logo.jpeg",
      width: 800,
      height: 600,
      alt: "Bodhiberry Logo",
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
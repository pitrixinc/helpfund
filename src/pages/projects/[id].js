import Image from "next/image";
import { Inter } from "next/font/google";
import Layout from "@/components/layout";
import CTA from "@/components/CTA";
import FeaturedProjects from "@/components/FeaturedProjects";
const inter = Inter({ subsets: ["latin"] });

export default function Projectid() {
  return (
    <Layout
      className={` ${inter.className}`}
      >
     <div>
        <span className="text-xl font-bold">Project Id Page</span>
        
      </div>
    </Layout>
  );
}

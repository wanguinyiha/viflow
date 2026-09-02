import Header from "@/components/Header";
import Hero from "@/components/Hero";
import Problem from "@/components/Problem";
import HowItWorks from "@/components/HowItWorks";
import Principle from "@/components/Principle";
import Roles from "@/components/Roles";
import Comparison from "@/components/Comparison";
import Faq from "@/components/Faq";
import CtaFooter from "@/components/CtaFooter";

export default function Home() {
  return (
    <main>
      <Header />
      <Hero />
      <Problem />
      <HowItWorks />
      <Principle />
      <Roles />
      <Comparison />
      <Faq />
      <CtaFooter />
    </main>
  );
}

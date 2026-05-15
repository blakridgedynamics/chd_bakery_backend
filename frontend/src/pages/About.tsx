import Layout from "@/components/layout/Layout";
import hero from "@/assets/hero.jpg";
import { Heart, Wheat, Award } from "lucide-react";

const About = () => (
  <Layout>
    <section className="container py-14 md:py-20 grid lg:grid-cols-2 gap-12 items-center">
      <div className="space-y-5">
        <p className="text-xs uppercase tracking-[0.18em] text-primary font-semibold">Our story</p>
        <h1 className="font-display text-4xl md:text-5xl text-balance">A home bakery, born from love for honest food.</h1>
        <p className="text-muted-foreground leading-relaxed">
          Chandigarh Bakery began in 2019 in a small home kitchen with one belief — that everyday bakes can be wholesome
          without compromising on the warmth of a hand-baked treat. Every cookie, cake and loaf is still made in small batches,
          using whole-wheat flour, jaggery, pure desi ghee and fresh seasonal ingredients.
        </p>
        <p className="text-muted-foreground leading-relaxed">
          Today, we serve hundreds of families across the tricity, but we still bake the way we did on day one — with patience,
          care, and zero shortcuts.
        </p>
      </div>
      <img src={hero} alt="Inside our kitchen" width={1600} height={1024} loading="lazy" className="rounded-3xl shadow-warm aspect-[4/3] object-cover w-full" />
    </section>

    <section className="bg-secondary/50 py-16">
      <div className="container grid md:grid-cols-3 gap-6">
        {[
          { icon: Heart, title: "Made with love", text: "Small-batch baking, every single day." },
          { icon: Wheat, title: "Honest ingredients", text: "Whole-wheat, jaggery, pure ghee — nothing artificial." },
          { icon: Award, title: "1,200+ happy homes", text: "Loved across Chandigarh, Mohali and Panchkula." },
        ].map(({ icon: Icon, title, text }) => (
          <div key={title} className="bg-card rounded-2xl p-7 shadow-card border border-border/40">
            <div className="h-12 w-12 rounded-full bg-gradient-primary text-primary-foreground grid place-items-center mb-4"><Icon className="h-5 w-5" /></div>
            <h3 className="font-display text-xl mb-2">{title}</h3>
            <p className="text-sm text-muted-foreground">{text}</p>
          </div>
        ))}
      </div>
    </section>
  </Layout>
);

export default About;

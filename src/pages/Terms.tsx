import { motion } from 'motion/react';

export default function Terms() {
  return (
    <div className="pt-32 pb-24 container mx-auto px-4 max-w-4xl space-y-12">
      <div className="space-y-4">
        <h1 className="text-4xl md:text-6xl font-display font-black uppercase italic">Terms of <span className="text-primary not-italic">Service</span></h1>
        <p className="text-gray-500 font-bold tracking-widest text-xs uppercase">Operational Agreement v1.0.4 | April 2026</p>
      </div>

      <div className="glass-card p-12 space-y-8 bg-dark/50 border-white/5 leading-relaxed text-gray-300">
        <section className="space-y-4">
          <h2 className="text-2xl font-bold text-white">1. Acceptance of Protocol</h2>
          <p>
            By accessing the OmniMind portal, you agree to abide by these operational protocols. Engagement with our AI entities constitutes a legal agreement to use the platform for legitimate creative, commercial, or research purposes only.
          </p>
        </section>

        <section className="space-y-4">
          <h2 className="text-2xl font-bold text-white">2. Prohibited Matrix Activities</h2>
          <p>
            Users are strictly forbidden from attempting to reverse-engineer our core neural weights, using the AI to generate malicious payloads, or conducting "prompt injection" attacks designed to bypass safety filters. Violations result in immediate nexus disconnection.
          </p>
        </section>

        <section className="space-y-4">
          <h2 className="text-2xl font-bold text-white">3. Intellectual Output Rights</h2>
          <p>
            While OmniMind generates the content, the user is the legal owner of all outputs. However, OmniMind reserves a non-exclusive right to use anonymized metadata to fine-tune our global transformer models for better accuracy.
          </p>
        </section>

        <section className="space-y-4">
          <h2 className="text-2xl font-bold text-white">4. Token Consumption & Limits</h2>
          <p>
            Access to "Pro" features is governed by the current subscription tier. OmniMind reserves the right to throttle usage if an account exceeds abnormal consumption patterns that threaten platform stability.
          </p>
        </section>
      </div>
    </div>
  );
}

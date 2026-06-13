import { motion } from 'motion/react';

export default function Privacy() {
  return (
    <div className="pt-32 pb-24 container mx-auto px-4 max-w-4xl space-y-12">
      <div className="space-y-4">
        <h1 className="text-4xl md:text-6xl font-display font-black uppercase italic">Privacy <span className="text-primary not-italic">Protocol</span></h1>
        <p className="text-gray-500 font-bold tracking-widest text-xs uppercase">Version 1.0.4 | Last Synced: April 2026</p>
      </div>

      <div className="glass-card p-12 space-y-8 bg-dark/50 border-white/5 leading-relaxed text-gray-300">
        <section className="space-y-4">
          <h2 className="text-2xl font-bold text-white">1. Data Neural Encryption</h2>
          <p>
            At OmniMind, your privacy is our core directive. All data processed through our neural network is encrypted at rest and in transit using military-grade cryptographic protocols. We do not "read" your data—our AI processes it in a stateless environment.
          </p>
        </section>

        <section className="space-y-4">
          <h2 className="text-2xl font-bold text-white">2. Intelligence Gathering</h2>
          <p>
            We collect minimal personal metadata to maintain your portal access. This includes your email for nexus authentication and any documents you explicitly upload for the AI to analyze. This data is never sold to third-party data brokers.
          </p>
        </section>

        <section className="space-y-4">
          <h2 className="text-2xl font-bold text-white">3. User Sovereignty</h2>
          <p>
            You own your intelligence. Any generations, summaries, or code produced by OmniMind belongs entirely to you. You maintain the right to purge your neural history at any time through the profile settings menu.
          </p>
        </section>

        <section className="space-y-4">
          <h2 className="text-2xl font-bold text-white">4. Biometric & Identity Security</h2>
          <p>
            Identity verification (OTP via email/phone) is used strictly to prevent unauthorized access to your unique cognitive workspace. We do not store biometric data.
          </p>
        </section>
      </div>
    </div>
  );
}

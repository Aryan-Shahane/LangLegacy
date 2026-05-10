LangLegacy: Unified Development Master Spec
1. Project Identity & Design System
Name: LangLegacy
Brand Vision: A "Digital Hearth"—an organic, tactile platform for indigenous language preservation and community storytelling.
Key Aesthetic: Hand-crafted, paper-on-paper textures, soft geometries, and a "living" audio-visual experience.

Unified Color Palette (Tailwind Configuration)
JavaScript
// tailwind.config.js
module.exports = {
  theme: {
    extend: {
      colors: {
        primary: "#061b0e",         // Forest Green
        secondary: "#9f4026",       // Terracotta
        tertiary: "#201500",        // Deep Earth
        background: "#fbf9f4",      // Cream Parchment
        surface: "#fbf9f4",
        "surface-container": "#f0eee9",
        "on-surface-variant": "#434843",
        "outline-variant": "#c3c8c1",
      },
      fontFamily: {
        serif: ["Literata", "serif"],
        sans: ["Be Vietnam Pro", "sans-serif"],
        mono: ["Work Sans", "sans-serif"],
      },
      borderRadius: {
        lg: "1rem",   // For large containers/story cards
        DEFAULT: "0.5rem", // For standard components/inputs
      }
    }
  }
}
2. Global UI Components (Shadcn Mapping)
When building these pages, map the raw HTML elements to these shadcn/ui components:

Navigation: Use Navigation Menu for the top bar.

Layout: Use Scroll Area with a custom noise-overlay class.

Cards: Use Card with rounded-lg and 1px borders of Muted Ochre (#8C7851) at 20% opacity.

Audio: Custom waveform component using secondary (Terracotta) bars.

Input: Input and Textarea with bottom-border-only focus states.

3. Page Structure & Source Scripts
3.1 Home: The Living Atlas (home.html)
Role: Landing and discovery.

Key Section: Hero area with an organic background image and broad search for languages.

Visual Feature: Interactive "Language Atlas" grid using high-radius cards.

3.2 Dictionary: The Verbal Archive (dictionary.html)
Role: Individual word and phrase lookup.

Key Components:

Search Bar: Centered with high-contrast outline-variant.

Archive List: Words separated by subtle, fading 1px dividers.

Audio Player: Central to every entry; must show a voice waveform.

3.3 Learning: Knowledge Transfer (learning.html)
Role: Gamified education and lessons.

Key Components:

Lesson Cards: Visual representations of language levels.

Score Ring: Circular progress indicator with secondary (Terracotta) stroke.

3.4 Chatrooms: The Oral Hearth (chatrooms.html)
Role: Real-time community interaction.

Key Components:

Sidebar: List of active "Hearths" (rooms) with participant counts.

Chat Feed: Message bubbles using soft cream containers.

Input Bar: Includes a prominent "Record Voice" button.

3.5 Community: The Story Vault (community.html)
Role: Long-form content and user contributions.

Key Components:

Story Cards: Large rounded-lg cards with featured images and audio snippets.

Contributor Profiles: Minimalist labels and heritage chips.

4. Final Implementation Directives
Noise Overlay: Apply a fixed 3% opacity noise SVG to the body for a paper texture.

Typography: * Use Literata for all headings (Display and Headline).

Use Be Vietnam Pro for body text.

Use Work Sans for labels and buttons.

Softened Geometries: Avoid all sharp corners. Even buttons should be "squircles".

Tactile States: Buttons must have a subtle "pressed" animation to feel physical.
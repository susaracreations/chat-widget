# UI Design Rules

- **Hybrid Styling Approach:**
  - **Dashboard & Main Site:** Use Tailwind CSS v4 for rapid, consistent, responsive layout development.
  - **Chat Widget (Embedded):** Use Vanilla CSS / isolated inline styles to prevent styling conflicts on host websites.
- **No Card-Based UI:** Do not use card-based layouts unless explicitly requested. Instead, utilize modern white space and border-based patterns for structure.
- **Mobile First & Fluid Spacing:** Prioritize mobile-first layouts with fluid spacing.
- **Strict Component Consistency:** Maintain strict consistency across all components.
- **Subtle Hover Effects Only:** Apply only subtle hover effects.
- **No Glowing or Box Shadows:** Do not use box-shadows, border glows, or glowing shadow animations on objects or hover states.
- **No Complex Animation Clamping:** Do not use complex clamp-based properties or excessive/heavy animations.

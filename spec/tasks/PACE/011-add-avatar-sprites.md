# Task 011: Add Animated Avatar Sprites

## Outcome
An animated sprite-based avatar representing the AI assistant that reacts to different states and interactions in the chat window.

## Files to Create
- `app/src/components/pace/avatar-sprite.tsx` - Sprite animation component
- `app/src/components/pace/sprite-animations.ts` - Animation definitions
- `app/public/sprites/` - Directory for sprite sheets

## Files to Modify
- `app/src/components/pace/ai-chat.tsx` - Integrate avatar into chat

## Implementation Details
1. Sprite setup:
   - Sprite sheet format (PNG with transparent background)
   - Frame size: 64x64px or 128x128px
   - Animation sets needed:
     - Idle (breathing, blinking)
     - Talking (mouth movement)
     - Thinking (processing)
     - Happy (successful action)
     - Confused (error/unclear)
     - Waving (greeting)

2. Avatar placement:
   - Next to AI name in chat header
   - Or floating beside chat window
   - Size: 48px in chat, can expand
   - Smooth scaling on hover

3. Animation triggers:
   - Idle: Default state
   - Talking: When AI is responding
   - Thinking: While processing request
   - Happy: After helpful action
   - Confused: On error or unclear input
   - Waving: On chat open/first message

4. Sprite animation system:
   - CSS-based sprite animation
   - Configurable frame rate
   - Smooth transitions between states
   - Loop control (once, infinite)
   - Animation queuing

5. Interactive features:
   - Click avatar for fun reactions
   - Poke animation on multiple clicks
   - Speech bubble for quick tips
   - Emotion feedback based on context
   - Avatar follows mouse slightly (parallax)

6. Customization options:
   - Different avatar styles/characters
   - User-selectable avatars
   - Avatar accessories/costumes
   - Seasonal themes
   - Unlock system for engagement

## Success Criteria
- Smooth sprite animations at 60fps
- Correct animation triggers
- No performance impact on graph
- Animations enhance user experience
- Works across different screen sizes
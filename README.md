# Top 8 - Myspace for Farcaster

A nostalgic Myspace-style "Top 8" application for Farcaster users. View and customize your closest connections based on interaction data from the Neynar API.

## Features

- **Auto-Generated Top 8**: Uses Neynar's Best Friends endpoint to automatically rank your top 8 connections based on mutual affinity scores
- **Retro Myspace Design**: Authentic 2000s styling with orange gradients, thin borders, and classic typography
- **Edit & Customize**: Owner can manually edit their Top 8 by searching and selecting users
- **Friends List**: View all reciprocal followers (mutual follows) with search functionality
- **Share Functionality**: Share your Top 8 with others
- **Responsive Design**: Works on mobile, tablet, and desktop

## Tech Stack

- **Frontend**: React + TypeScript + Vite
- **Styling**: Tailwind CSS (custom retro theme)
- **Database**: Supabase (PostgreSQL with Row Level Security)
- **API**: Neynar Farcaster API
- **Routing**: React Router

## Environment Variables

Create a `.env` file in the project root:

```env
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
VITE_NEYNAR_API_KEY=your_neynar_api_key
```

### Getting API Keys

1. **Supabase**:
   - Already configured in this project
   - URL: `https://ltzcoljvlefhxuofeger.supabase.co`

2. **Neynar**:
   - Sign up at [https://neynar.com](https://neynar.com)
   - Get your API key from the dashboard
   - Update `VITE_NEYNAR_API_KEY` in `.env`

## Installation

```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

## Database Schema

The application uses three main tables:

### `profiles`
Stores Farcaster user profile information
- `fid` (bigint, primary key) - Farcaster ID
- `username`, `display_name`, `pfp_url`
- `last_seen_at`, `created_at`

### `top8_sets`
Stores Top 8 configuration per user
- `owner_fid` (bigint, primary key)
- `algorithm_version` (text) - e.g., "neynar_best_friends_v1"
- `customized` (boolean) - Whether user manually edited
- `generated_at`, `updated_at`

### `top8_entries`
Individual Top 8 entries
- `owner_fid` (bigint) - Owner's FID
- `slot` (1-8) - Position in the Top 8
- `target_fid` (bigint) - Friend's FID
- `source` ("auto" | "manual")
- `mutual_affinity_score` (number)

## Usage

### View Someone's Top 8

1. Go to homepage
2. Enter a Farcaster username
3. View their auto-generated Top 8

Or directly navigate to: `/{username}`

### Edit Your Own Top 8

1. Sign in with Farcaster (future feature)
2. Navigate to your profile
3. Click "Edit" button
4. Click any slot to search and select a different user
5. Click "Save Changes" to persist

### View All Friends

Click "View all of [username]'s friends" to see the complete list of mutual followers.

## API Endpoints Used

- `GET /v2/farcaster/user/best_friends` - Get top connections by affinity score
- `GET /v2/farcaster/followers/reciprocal` - Get mutual followers
- `GET /v2/farcaster/user/search` - Search users by username
- `GET /v2/farcaster/user/bulk` - Hydrate multiple user profiles
- `GET /v2/farcaster/user/by_username` - Get user by username

## Future Enhancements

- [ ] Implement Sign in with Farcaster (SIWN) authentication
- [ ] Add drag-and-drop reordering in edit mode
- [ ] Generate OG images for social sharing
- [ ] Base Mini App integration with manifest and compose hooks
- [ ] Periodic auto-refresh of non-customized Top 8s
- [ ] Analytics and interaction tracking
- [ ] Custom themes and layouts

## Project Structure

```
src/
├── components/         # React components
│   ├── Top8Grid.tsx   # Main Top 8 display grid
│   └── SearchModal.tsx # User search modal
├── pages/             # Page components
│   ├── HomePage.tsx   # Landing page
│   ├── UserPage.tsx   # User Top 8 view
│   └── FriendsPage.tsx # Friends list
├── lib/               # Services and utilities
│   ├── supabase.ts    # Supabase client & types
│   ├── neynar.ts      # Neynar API client
│   └── top8Service.ts # Top 8 business logic
└── App.tsx            # Main app with routing
```

## Contributing

Contributions are welcome! Please follow these guidelines:

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

MIT License - feel free to use this project for any purpose.

## Acknowledgments

- Inspired by the original Myspace Top 8 feature
- Built on Farcaster protocol
- Powered by Neynar API
- Database hosting by Supabase

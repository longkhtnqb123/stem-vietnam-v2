# STEM Vietnam v3.0 - Development Roadmap

> **Status**: Đang triển khai Phase 6 (Scale & Polish)

---

## ✅ Phase 2: UI Redesign

### Design System
- **Màu chủ đạo**: Emerald/Teal palette thay thế Blue
- **Typography**: Inter font family
- **Components**: Glass morphism, shadow glow effects

### Files Changed
| File | Changes |
|------|---------|
| `src/styles/design-tokens.css` | NEW - Color tokens, typography |
| `tailwind.config.js` | Emerald colors, animations |
| `src/index.css` | Bento utilities, button variants |
| `LandingPage.tsx` | Hero gradient, feature cards |
| `MainLayout.tsx` | Collapsible sidebar + tooltips |
| `StudentDashboard.tsx` | Stats cards + gamification |
| `TeacherDashboard.tsx` | Emerald theme |
| `HelpPage/SettingsPage/AdminPage` | Color updates |

---

## ✅ Phase 3: Gamification

### Database (011_gamification.sql)
- `badges` - 9 default badges
- `user_badges` - Earned badges tracking
- `daily_goals` - Daily learning targets
- `xp_transactions` - XP history

### API (gamification-routes.ts)
- `GET /profile` - XP, level, badges
- `GET /leaderboard` - Top users
- `POST /check-badges` - Auto-award

### Components (GamificationComponents.tsx)
- XPBar, StreakCounter, BadgeDisplay
- DailyGoalCard, Leaderboard, AchievementToast

---

## ✅ Phase 4: Multi-School

### Database (012_teacher_invitations.sql)
- `teacher_invitations` - Mã mời giáo viên
- `schools` - School management

### API Files
- `teacher-routes.ts` - Invite codes, verify, use
- `school-routes.ts` - CRUD, analytics, assign teacher

### Frontend
- `SchoolAdminPage.tsx` - Admin portal

---

## ✅ Phase 5: Research Analytics

### Database (013_research_analytics.sql)
- `event_logs` - User behavior tracking
- `surveys` + `survey_responses`
- `research_exports`
- `consent_records`

### API (research-routes.ts)
- Event logging (privacy-safe IP hash)
- Stats dashboard
- Surveys CRUD
- Data export (JSON)

### Frontend
- `ResearchDashboard.tsx` - Analytics visualization

---

## 🔄 Phase 6: Scale & Polish

### In Progress
- [ ] Route registration in main router
- [ ] Documentation (this file)
- [ ] Performance optimization tips

### Next Steps
1. Register new routes in `workers/src/index.ts`
2. Add new pages to React Router
3. Run database migrations
4. Deploy to production

---

## 📋 Deployment Checklist

```bash
# 1. Apply migrations
cd workers
npx wrangler d1 migrations apply stem-vietnam-db --remote

# 2. Deploy workers
npx wrangler deploy

# 3. Build frontend
cd ..
npm run build

# 4. Deploy to Pages
npx wrangler pages deploy dist
```

---

## 🎯 Summary

| Phase | Status | Key Deliverables |
|-------|--------|------------------|
| Phase 2 | ✅ | Emerald theme, collapsible sidebar |
| Phase 3 | ✅ | XP, badges, leaderboard, daily goals |
| Phase 4 | ✅ | Schools, teacher invites |
| Phase 5 | ✅ | Event tracking, surveys, exports |
| Phase 6 | 🔄 | Documentation, optimization |

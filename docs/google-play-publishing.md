# Google Play Publishing Guide

## 1. Developer Account Setup

- **One-time fee**: $25 registration fee
- **Account type**: Personal (requires government ID) or Organization (for companies/LLCs)
- **Link**: https://play.google.com/console

## 2. Identity Verification (New 2025-2026 Requirement)

- All developers must verify their identity
- Personal accounts: valid government-issued ID
- Organization accounts: business documentation
- This applies even to sideloaded apps starting 2026

## 3. Testing Requirement (Post-Nov 2023 Accounts)

- Must run a **closed test with at least 12 testers** for **14 days** before production release
- Testers must opt-in to the test

## 4. Technical Requirements

- **AAB format only** (APKs no longer accepted for new apps)
- **Play App Signing** must be enabled
- **Target API level**: Android 15 (API 35) or higher by August 31, 2025
- Max compressed download: 4 GB
- App must be digitally signed with your developer certificate

## 5. Store Listing Assets

- App title, description, screenshots
- Feature graphic (1024x500)
- App icon (512x512)
- Privacy policy URL
- Content rating questionnaire

## 6. Policy Compliance

- Follow [Google Play Developer Policies](https://play.google/developer-content-policy/)
- Complete data safety form
- Declare permissions usage

## Timeline

| When | Action |
|------|--------|
| Now | Create developer account, verify identity |
| Before release | Run 14-day closed test with 12+ testers |
| Aug 31, 2025 | Must target API 35 (Android 15) |

---

## How to Get 12 Testers for Closed Testing

### Free Options

**1. Friends & Family**
- Easiest approach - ask people you know with Android phones
- They just need to opt-in via a link you share from Play Console

**2. Testers Community (Free)**
- Download the [Testers Community app](https://play.google.com/store/apps/details?id=com.testerscommunity.app) on Google Play
- Post your closed-test link and community members will help
- Also check r/TestersCommunity on Reddit

**3. Social Media**
- Post on Twitter, LinkedIn, Facebook asking for volunteers
- Developer Discord servers and forums

### Paid Services

- **TesterMob** - hire testers by device/market
- **20apptester.com** - similar paid service
- Usually costs $20-50 for 12 testers

### Important Notes

| Rule | Details |
|------|---------|
| Minimum testers | 12 opted-in |
| Duration | 14 consecutive days |
| Uninstalls | Don't break your count - once opted in, they count |
| Recommended | Aim for 20-30 testers (buffer for dropouts) |
| Avoid | Don't add 80+ testers - Google may flag this |
| Review time | ~7 days after the 14-day period |

### How It Works

1. Set up closed testing track in Play Console
2. Add tester emails or create a Google Group
3. Share the opt-in link with your testers
4. They install and opt-in via the link
5. Wait 14 days with 12+ testers opted in
6. Production tab unlocks for review

---

## Sources

- [Target API Level Requirements - Play Console Help](https://support.google.com/googleplay/android-developer/answer/11926878?hl=en)
- [Create and Set Up Your App - Play Console Help](https://support.google.com/googleplay/android-developer/answer/9859152?hl=en)
- [App Testing Requirements - Play Console Help](https://support.google.com/googleplay/android-developer/answer/14151465?hl=en)
- [Everything About the 12 Testers Requirement - Google Play Community](https://support.google.com/googleplay/android-developer/community-guide/255621488/everything-about-the-12-testers-requirement?hl=en)
- [Google Developer Verification 2026 Requirements](https://www.nomidmdm.com/en/blog/the-core-change-mandatory-verification-for-all-android-apps)
- [Android App Publishing Guide 2025](https://foresightmobile.com/blog/complete-guide-to-android-app-publishing-in-2025)

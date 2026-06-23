# Pinkie

Informal promise tracker for [circles/garage](https://garage.aboutcircles.com/) — **native CRC on Circles**, not bolted-on payments.

## What it does

- **Make a promise** — one sentence + deadline
- **Share a link** — friend opens inside Circles; referral invite when sharing from the host
- **Close the loop** — maker taps *I did it* or friend taps *They did it*
- **Optional thanks** — send 1 CRC after a promise is kept
- **Profile** — optional display name + Cloudinary avatar

## Stack

- Next.js 16 + shadcn/ui (preset `b0`)
- Convex — promises + profiles
- Cloudinary — optional avatar uploads
- `@aboutcircles/miniapp-sdk` — wallet, referrals, CRC transfers

## Develop

```bash
cd week6/pinkie
npm install
cp .env.example .env.local
npm run convex:dev   # in a second terminal
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

Test inside Circles: [playground](https://circles.gnosis.io/playground?url=http://localhost:3000)

## Environment

See `.env.example`. Convex defaults to `sensible-meadowlark-57`. Add Cloudinary vars for avatar uploads.

## Garage submission

Copy from [`garage/submission-copy.txt`](garage/submission-copy.txt) and register at [garage.aboutcircles.com/register](https://garage.aboutcircles.com/register).

## Circles primitives used

- `requestCreateAccount()` — onboarding + referrals
- `onWalletChange()` — wallet lifecycle
- Referral secrets in share URLs
- `constructAdvancedTransfer()` — optional 1 CRC thanks

# Pending Subscriptions Feature Design

**Date:** 2026-01-12
**Status:** Implemented

## Overview

A feature that shows medium-confidence (40-80%) email scan detections for manual user review and approval, preventing false positives while maximizing subscription detection.

## Problem Statement

The email scanner detects subscriptions with varying confidence levels. High-confidence detections (80%+) are auto-created as subscriptions, but medium-confidence detections (40-80%) were being logged and discarded, missing potential subscriptions.

## Solution

Add a "pending subscriptions" workflow where medium-confidence detections are stored in the database for manual review. Users can approve (convert to subscription) or dismiss (mark as not a subscription).

## Architecture

### Database Schema

New `PendingSubscription` model with:
- Detection data (serviceName, confidence, amount, currency)
- Trial information (isTrial, trialEndsAt)
- Billing information (nextBillingDate)
- Email source (emailId, subject, from, date, rawEmailData)
- Lifecycle (status: pending/approved/dismissed, expiresAt)

### Email Scanner Integration

- High confidence (≥80%): Auto-create subscription
- Medium confidence (40-80%): Create pending subscription
- Low confidence (<40%): Skip

Deduplication by emailId prevents duplicate pending items.

### Cleanup Worker

Daily background job deletes pending subscriptions older than 30 days to prevent clutter.

### API Routes

- POST /api/pending-subscriptions/approve: Create subscription, mark as approved
- POST /api/pending-subscriptions/dismiss: Mark as dismissed

Both routes use authentication, authorization, input validation, and transaction safety.

### UI Components

- **PendingSubscriptionCard**: Individual card with approve/dismiss actions
- **PendingSubscriptionsSection**: Blue-themed notification section on dashboard
- **Dashboard Integration**: Shows pending items above regular subscriptions

## User Experience

1. User connects Gmail and triggers scan
2. Email scanner creates pending subscriptions for medium-confidence detections
3. Dashboard shows blue notification section with pending items
4. User reviews each item:
   - Click "Add This" to approve → creates subscription
   - Click "Dismiss" to reject → marks as dismissed
5. Items auto-expire after 30 days if not reviewed

## Key Design Decisions

**Q: Why 40-80% confidence threshold?**
A: Based on email scanning results showing 0.4-0.8 range captures real subscriptions that aren't obvious enough for auto-creation.

**Q: Why 30-day expiration?**
A: Balances giving users time to review vs preventing indefinite clutter.

**Q: Why show on dashboard vs separate page?**
A: Users see pending items immediately without navigation, increasing review rate.

**Q: Why simple approve/dismiss vs edit-before-approve?**
A: Reduces friction - users can approve quickly and edit the subscription afterward if needed.

## Implementation Notes

- Decimal types converted to numbers when passing to client components
- Transaction safety ensures atomic approve operations
- Router.refresh() used instead of window.location.reload() for better UX
- Inline error messages instead of alert() dialogs

## Future Enhancements

- Pending subscription editing before approval
- Bulk approve/dismiss actions
- Configurable confidence thresholds
- Email preview in pending subscription cards

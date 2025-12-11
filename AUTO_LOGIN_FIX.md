# Auto-Login Account Saving Fix

## Problem
When the app first launched and auto-logged in the user (from a saved session), the account was NOT being saved to the multi-account store. This meant users who signed up and stayed logged in would not have their account available in the switcher until they manually signed in again.

## Solution
Updated `AuthContext` (`/lib/contexts/auth-context.tsx`) to:

1. **On App Launch Auto-Login:**
   - When session is restored from storage
   - Fetch artist or client profile
   - Get saved credentials from `credentials-manager`
   - Save account to multi-account store
   - Update lastUsed timestamp

2. **For Artist Accounts:**
   - Save both preview mode (no subscription) and production mode (active subscription)
   - Previously, preview mode artists were cleared from auth state
   - Now they stay logged in and are saved to multi-account store

3. **For Client Accounts:**
   - Save on auto-login with linked artist photo
   - Update lastUsed timestamp

## Flow Now

### First Time (Sign Up)
```
1. User signs up
2. Account saved to multi-account store ✅ (signup.tsx)
3. User stays logged in
4. App closed
```

### App Relaunch (Auto-Login)
```
1. App starts
2. AuthContext initializes
3. Restores session from storage
4. Gets artist/client profile
5. Gets credentials from credentials-manager
6. Saves/updates account in multi-account store ✅ (NEW FIX)
7. Updates lastUsed timestamp
8. User stays logged in
```

### Manual Sign In
```
1. User signs in
2. Account saved to multi-account store ✅ (signin.tsx)
3. Updates lastUsed timestamp
```

## Code Changes

### `/lib/contexts/auth-context.tsx`
- Added imports: `getCredentials`, `saveAccount`, `updateAccountLastUsed`
- Modified `initializeAuthentication()` function:
  - For artist: Save to multi-account store (both preview and production modes)
  - For client: Save to multi-account store
  - Both: Update lastUsed timestamp
- Fixed artist preview mode: No longer clears auth, now stays logged in

## Testing

1. **Sign Up → Close → Reopen:**
   ```
   - Sign up new account
   - Close app completely
   - Reopen app
   - Verify account appears in switcher modal
   ```

2. **Sign In → Close → Reopen:**
   ```
   - Sign in with existing account
   - Close app completely
   - Reopen app
   - Verify account appears in switcher modal
   ```

3. **Preview Mode Artists:**
   ```
   - Sign up without subscribing
   - Close app
   - Reopen app
   - Verify stays logged in (preview mode)
   - Verify account in switcher modal
   ```

4. **Client Accounts:**
   ```
   - Sign in as client
   - Close app
   - Reopen app
   - Verify account in switcher modal
   ```

## Edge Cases Handled

1. **Credentials not found:** Silently fails, logs warning (account not added to switcher)
2. **Email mismatch:** Only saves if credentials match the profile email
3. **Storage errors:** Caught and logged, doesn't crash app
4. **Preview mode artists:** Now saved (previously were cleared)

## Result

✅ All user accounts are now properly saved to multi-account store regardless of how they logged in (signup, signin, or auto-login on app launch).

# Permission declarations (Play Console → App content)

Play reviews three things in Nifti by hand. Paste these answers. Record the short video described at the end and upload it (unlisted YouTube link or Drive link is fine).

## 1. Accessibility API (the "open chat" reader)

Play's form: **App content → Accessibility API**.

- **Is your app an accessibility tool?** No. (Our `isAccessibilityTool` is false, which is correct.)
- **Which feature uses the Accessibility API?**
  > Nifti brings a business owner's Viber customer chats into their Nifti order inbox. Viber shows no notification for the chat that is open on screen, so those messages would be lost. With the user's consent, Nifti's accessibility service reads the text, sender and time of the messages in the open Viber chat (package com.viber.voip only) and saves them to the user's own business account. It does not read any other app, does not perform actions, clicks or typing, and does not collect passwords.
- **What data is collected?** Message text, sender name and time from the open Viber chat only.
- **Is it shared?** No. Sent encrypted to the user's own business account only.
- **Prominent disclosure:** shown in the app before the user is sent to Accessibility settings (screen title: "Nifti reads the Viber chat you have open", buttons "Not now" / "I agree, continue").

## 2. Notification listener (Viber notifications)

Not a Play declaration form, but reviewers check it. In the listing description and in-app disclosure we say:
> Nifti reads Viber notifications only (sender, text, time) to bring business chats into Nifti. Every other app's notifications are ignored.

## 3. Contacts (READ_CONTACTS)

Contacts is not a restricted permission, but it is listed in Data safety. Our answer: contacts are read on the phone to match a Viber sender's name to their saved number; only that one sender's number is sent with their message, the contact list itself is never uploaded.

## 4. Battery optimization (REQUEST_IGNORE_BATTERY_OPTIMIZATIONS)

If Play asks: Nifti is a real-time message relay. It must keep running to deliver customer messages and send replies the user typed in Nifti; Firebase Cloud Messaging can't do this because the messages come from another app on the phone.

## 5. Foreground service

Nifti does not use a foreground service. No declaration needed.

## The review video (about 60 seconds, record on a real Android phone)

1. Open Nifti, sign in, go to Messages → Connect Viber.
2. Tap "Turn on" on the open-chat step. Show the disclosure screen and tap "I agree, continue".
3. Show Android's Accessibility settings, switch on Nifti.
4. Open Viber, open a chat, have someone send a message.
5. Switch back to Nifti: the message is in Messages.

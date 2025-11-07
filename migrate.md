# Database Refactor & Role-Based Access Control (RBAC) Implementation Plan

This document outlines the strategic plan to refactor the application's database structure. The primary goals are to establish clear data ownership, implement a robust role-based access control (RBAC) system for communities, and create a safe, repeatable process for migrating existing data from MongoDB to the new Firestore structure.

---

## **Phase 1: Establish the New Data Model & Security Foundation**

**Objective:** Modify Firestore's underlying structure and security rules to support a multi-tenant, role-based system before any data is migrated. This phase prepares the destination.

1.  **Update the `Community` Entity Schema (`docs/backend.json`)**
    *   The `Community` entity will be modified to include a new `roles` map.
    *   **Action:** Add a `roles` property of type `object`. This object will store user UIDs as keys and their assigned role (e.g., "owner", "admin", "member") as string values.
    *   **Action:** For efficient querying, we will also add a `memberIds` property, which will be an `array` of `string`s, containing all user UIDs that are part of the community. This array will be derived from the keys of the `roles` map.

2.  **Enhance Firestore Security Rules (`firestore.rules`)**
    *   The rules for the `/communities/{communityId}` path will be rewritten to enforce the new RBAC model.
    *   **Read Access Rule:** A user will be allowed to read a community document **if and only if** their UID is present in the `memberIds` array.
        *   *Rule:* `allow read: if request.auth.uid in resource.data.memberIds;`
    *   **Write Access Rule:** A user will be allowed to update a community document **if and only if** their role in the `roles` map is `owner` or `admin`.
        *   *Rule:* `allow update: if resource.data.roles[request.auth.uid] in ['owner', 'admin'];`
    *   **Delete Access Rule**: Only the designated `owner` will be able to delete a community.
        *   *Rule:* `allow delete: if resource.data.roles[request.auth.uid] == 'owner';`
    *   **Create Access Rule**: Any authenticated user can create a community, but they must set themselves as the `owner` and include their UID in the `memberIds` list upon creation.

---

## **Phase 2: Adapt the Application to the New Model**

**Objective:** Update the client-side application code to query and interact with Firestore according to the new, stricter data model and security rules.

1.  **Refactor Community List Query (`src/components/communities/community-list.tsx`)**
    *   The Firestore query that fetches the list of communities will be modified.
    *   **Action:** Change the query from `collection(firestore, 'communities')` to `query(collection(firestore, 'communities'), where('memberIds', 'array-contains', user.uid))`.
    *   **Outcome:** This ensures the application only ever requests communities that the user is a member of, preventing unnecessary access and aligning with the new security rules.

---

## **Phase 3: Build the Migration Tool & Execute**

**Objective:** Enhance the `/compare` page to serve as a one-click migration tool, allowing you to safely migrate one community at a time using MongoDB as the source of truth.

1.  **Upgrade the "Fix & Sync" Server Action (`src/app/compare/actions.ts`)**
    *   The `fixAndSyncCommunity` function will be rewritten to perform a full data migration for a single community.
    *   **Action:** When triggered for a specific community, the function will:
        1.  Fetch the full community data and its `usersList` from **MongoDB**.
        2.  Iterate through the MongoDB `usersList` to build the new `roles` map and the `memberIds` array for Firestore.
        3.  **Crucially, it will identify the MongoDB user `will.poole@mac.com` and assign their role to the Firebase user `ashok@kyozo.com` (UID: `x3cikshkoUb0i8LIfqfKf2n3G272`) with the role of `owner`.** All other users will be assigned the `member` role.
        4.  Use a `setDoc(communityRef, { ... }, { merge: true })` operation to update the corresponding community in Firestore. This non-destructively adds the new `roles` and `memberIds` fields, officially migrating that community to the new RBAC structure.

---

This phased approach ensures that we build a secure foundation first, then adapt the application, and finally provide you with a safe, controlled method to migrate your data without disrupting the existing application.

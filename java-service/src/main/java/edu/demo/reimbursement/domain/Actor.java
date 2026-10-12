package edu.demo.reimbursement.domain;

import java.util.EnumSet;
import java.util.Set;

/**
 * The user performing an action. The web server builds this from the
 * verified session and database roles — never from browser input.
 */
public class Actor {

    private final String userId;
    private final Set<Role> roles;
    private final boolean claimOwner;

    public Actor(String userId, Set<Role> roles, boolean claimOwner) {
        this.userId = userId;
        this.roles = roles == null || roles.isEmpty() ? EnumSet.noneOf(Role.class) : EnumSet.copyOf(roles);
        this.claimOwner = claimOwner;
    }

    public boolean has(Role role) { return roles.contains(role); }
    public boolean isClaimOwner() { return claimOwner; }
    public String getUserId() { return userId; }
}

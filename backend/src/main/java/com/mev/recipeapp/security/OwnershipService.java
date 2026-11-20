package com.mev.recipeapp.security;

import com.mev.recipeapp.models.CustomUserDetails;
import com.mev.recipeapp.repository.ComponentRepository;
import com.mev.recipeapp.repository.RecipeRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Component;

/**
 * Ownership checks used from {@code @PreAuthorize} expressions, e.g.
 * {@code @PreAuthorize("hasAuthority('ROLE_ADMIN') or @ownership.ownsRecipe(#id, authentication)")}.
 *
 * URL rules in {@link SecurityConfig} only say "you must be logged in"; these checks make sure
 * a logged-in user can only modify their own account, recipes and components.
 */
@Component("ownership")
@RequiredArgsConstructor
public class OwnershipService {

    private final RecipeRepository recipeRepository;
    private final ComponentRepository componentRepository;

    public boolean isSelf(Long userId, Authentication authentication) {
        Long currentUserId = currentUserId(authentication);
        return currentUserId != null && currentUserId.equals(userId);
    }

    public boolean ownsRecipe(Long recipeId, Authentication authentication) {
        Long currentUserId = currentUserId(authentication);
        return currentUserId != null && recipeId != null
                && recipeRepository.existsByIdAndUserId(recipeId, currentUserId);
    }

    public boolean ownsComponent(Long componentId, Authentication authentication) {
        Long currentUserId = currentUserId(authentication);
        return currentUserId != null && componentId != null
                && componentRepository.existsByIdAndRecipeUserId(componentId, currentUserId);
    }

    private Long currentUserId(Authentication authentication) {
        if (authentication != null && authentication.getPrincipal() instanceof CustomUserDetails details) {
            return details.getId();
        }
        return null;
    }
}

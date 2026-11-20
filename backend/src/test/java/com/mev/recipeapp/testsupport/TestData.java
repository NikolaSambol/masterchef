package com.mev.recipeapp.testsupport;

import com.mev.recipeapp.models.AppRole;
import com.mev.recipeapp.models.Category;
import com.mev.recipeapp.models.Component;
import com.mev.recipeapp.models.CustomUserDetails;
import com.mev.recipeapp.models.Ingredients;
import com.mev.recipeapp.models.Instruction;
import com.mev.recipeapp.models.Recipe;
import com.mev.recipeapp.models.Role;
import com.mev.recipeapp.models.User;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;

/**
 * Small factory methods that build model objects for unit tests ("test data builders").
 *
 * <p>Keeping this in one place means each test only spells out the values it actually cares about,
 * which makes the tests shorter and easier to read.
 */
public final class TestData {

    private TestData() {
    }

    public static User user(long id, String email, AppRole appRole) {
        User user = new User("Name" + id, "Surname" + id, email, "{noop}password");
        user.setId(id);
        user.setRole(new Role(appRole));
        user.setCreatedDate(LocalDateTime.of(2025, 6, 1, 12, 0));
        return user;
    }

    /** The object Spring Security keeps as "the logged-in user" (the principal). */
    public static CustomUserDetails principal(User user) {
        return new CustomUserDetails(user);
    }

    public static Category category(long id, String name) {
        Category category = new Category(name);
        category.setId(id);
        return category;
    }

    public static Recipe recipe(long id, String name, User author, Category category) {
        Recipe recipe = new Recipe(name, null, null, "30 min", author, category);
        recipe.setId(id);
        recipe.setCreationDate(LocalDate.of(2025, 6, 1));
        recipe.setComponents(new ArrayList<>());
        return recipe;
    }

    public static Component component(long id, String name, Recipe recipe, String ingredients, String instruction) {
        Component component = new Component(name, null, recipe, new Ingredients(ingredients), new Instruction(instruction));
        component.setId(id);
        return component;
    }
}

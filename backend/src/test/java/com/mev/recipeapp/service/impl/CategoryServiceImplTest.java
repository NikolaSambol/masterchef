package com.mev.recipeapp.service.impl;

import com.mev.recipeapp.dtos.CategoryDTO;
import com.mev.recipeapp.models.Category;
import com.mev.recipeapp.repository.CategoryRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.List;
import java.util.Optional;

import static com.mev.recipeapp.testsupport.TestData.category;
import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.assertj.core.groups.Tuple.tuple;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class CategoryServiceImplTest {

    @Mock
    private CategoryRepository categoryRepository;

    @InjectMocks
    private CategoryServiceImpl categoryService;

    @Test
    void allCategoriesAreReturnedAsDtos() {
        when(categoryRepository.findAll()).thenReturn(List.of(category(1L, "Slastice"), category(2L, "Juhe")));

        assertThat(categoryService.getAllCategories())
                .extracting(CategoryDTO::getId, CategoryDTO::getCategoryName)
                .containsExactly(tuple(1L, "Slastice"), tuple(2L, "Juhe"));
    }

    @Test
    void creatingACategorySavesItsName() {
        when(categoryRepository.save(any(Category.class))).thenAnswer(call -> call.getArgument(0));

        assertThat(categoryService.createNewCategory("Juhe").getName()).isEqualTo("Juhe");
    }

    @Test
    void updatingRenamesTheCategory() {
        Category soups = category(2L, "Juhe");
        when(categoryRepository.findById(2L)).thenReturn(Optional.of(soups));

        categoryService.updateCategory(2L, "Juhe i variva");

        assertThat(soups.getName()).isEqualTo("Juhe i variva");
        verify(categoryRepository).save(soups);
    }

    @Test
    void updatingAnUnknownCategoryFailsWithoutSaving() {
        when(categoryRepository.findById(404L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> categoryService.updateCategory(404L, "x"))
                .isInstanceOf(IllegalArgumentException.class);
        verify(categoryRepository, never()).save(any());
    }

    @Test
    void deletingDelegatesToTheRepository() {
        categoryService.deleteCategoryById(3L);

        verify(categoryRepository).deleteById(3L);
    }
}

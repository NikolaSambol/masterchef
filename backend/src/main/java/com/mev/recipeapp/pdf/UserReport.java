package com.mev.recipeapp.pdf;

import com.mev.recipeapp.dtos.RecipeSummaryDTO;
import com.mev.recipeapp.dtos.response.UserInfoResponse;

import java.util.List;

/** Everything the single-user PDF shows: the user and a short list of their recipes. */
public record UserReport(UserInfoResponse user, List<RecipeSummaryDTO> recipes) {
}

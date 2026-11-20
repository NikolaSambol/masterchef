package com.mev.recipeapp.dtos.requests;

import lombok.Getter;
import lombok.Setter;
import org.springframework.web.multipart.MultipartFile;

@Getter
@Setter
public class CreateRecipeRequest {
    private String name;
    private MultipartFile image;
    private MultipartFile video;
    private String preparationTime;
    private Long category;
    /** Update only: remove the existing video. Without it, the video is kept unless a new one is uploaded. */
    private boolean deleteVideo;
}

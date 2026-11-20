package com.mev.recipeapp.service.impl;

import com.mev.recipeapp.dtos.requests.UserUpdateRequest;
import com.mev.recipeapp.dtos.response.LoginResponse;
import com.mev.recipeapp.dtos.response.UserInfoResponse;
import com.mev.recipeapp.models.AppRole;
import com.mev.recipeapp.models.User;
import com.mev.recipeapp.repository.UserRepository;
import com.mev.recipeapp.security.jwt.JwtUtil;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.core.userdetails.UserDetails;

import java.util.List;
import java.util.Optional;

import static com.mev.recipeapp.testsupport.TestData.user;
import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class UserServiceImplTest {

    @Mock private UserRepository userRepository;
    @Mock private JwtUtil jwtUtil;

    @InjectMocks
    private UserServiceImpl userService;

    private User ana;

    @BeforeEach
    void setUp() {
        ana = user(1L, "ana@test.hr", AppRole.ROLE_USER);
    }

    @Test
    void getUserByIdReturnsTheUsersPublicInfo() {
        when(userRepository.findById(1L)).thenReturn(Optional.of(ana));

        UserInfoResponse info = userService.getUserById(1L);

        assertThat(info.getId()).isEqualTo(1L);
        assertThat(info.getEmail()).isEqualTo("ana@test.hr");
        assertThat(info.getRole()).containsExactly("ROLE_USER");
        assertThat(info.isEnabled()).isTrue();
        assertThat(info.getCreationDate()).isEqualTo("2025-06-01T12:00");
    }

    @Test
    void getUserByIdFailsForAnUnknownId() {
        when(userRepository.findById(404L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> userService.getUserById(404L))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("404");
    }

    @Test
    void getAllUsersMapsEveryUser() {
        when(userRepository.findAll()).thenReturn(List.of(ana, user(2L, "admin@test.hr", AppRole.ROLE_ADMIN)));

        assertThat(userService.getAllUsers())
                .extracting(UserInfoResponse::getEmail)
                .containsExactly("ana@test.hr", "admin@test.hr");
    }

    @Test
    void updatingNameWithoutEmailSavesAndReturnsNoNewToken() {
        when(userRepository.findById(1L)).thenReturn(Optional.of(ana));

        LoginResponse response = userService.updateUser(1L, new UserUpdateRequest("Ivana", " ", null));

        assertThat(response).isNull();
        assertThat(ana.getName()).isEqualTo("Ivana");
        assertThat(ana.getSurname()).isEqualTo("Surname1"); // blank surname was ignored
        verify(userRepository).save(ana);
        verify(jwtUtil, never()).generateTokenFromUsername(any());
    }

    @Test
    @org.junit.jupiter.api.DisplayName("changing the email returns a new token, because the email is the JWT subject")
    void changingTheEmailReturnsATokenForTheNewEmail() {
        when(userRepository.findById(1L)).thenReturn(Optional.of(ana));
        when(jwtUtil.generateTokenFromUsername(any())).thenReturn("fresh-token");

        LoginResponse response = userService.updateUser(1L, new UserUpdateRequest(null, null, "ana.new@test.hr"));

        assertThat(response.getJwtToken()).isEqualTo("fresh-token");
        assertThat(response.getEmail()).isEqualTo("ana.new@test.hr");
        assertThat(ana.getEmail()).isEqualTo("ana.new@test.hr");

        // Check WHICH user the token was generated for.
        ArgumentCaptor<UserDetails> tokenFor = ArgumentCaptor.forClass(UserDetails.class);
        verify(jwtUtil).generateTokenFromUsername(tokenFor.capture());
        assertThat(tokenFor.getValue().getUsername()).isEqualTo("ana.new@test.hr");
    }

    @Test
    void suspendingAUserDisablesAndSavesThem() {
        when(userRepository.findById(1L)).thenReturn(Optional.of(ana));

        userService.suspendUser(1L);

        ArgumentCaptor<User> saved = ArgumentCaptor.forClass(User.class);
        verify(userRepository).save(saved.capture());
        assertThat(saved.getValue().isEnabled()).isFalse();
    }

    @Test
    void deletingAUserDelegatesToTheRepository() {
        userService.deleteUserById(1L);

        verify(userRepository).deleteById(1L);
    }
}

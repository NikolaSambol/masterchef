package com.mev.recipeapp.controllers;

import com.mev.recipeapp.dtos.requests.LoginRequest;
import com.mev.recipeapp.dtos.requests.PasswordChangeRequest;
import com.mev.recipeapp.dtos.requests.SignUpRequest;
import com.mev.recipeapp.dtos.response.AuthErrorResponse;
import com.mev.recipeapp.dtos.response.LoginResponse;
import com.mev.recipeapp.dtos.response.UserInfoResponse;
import com.mev.recipeapp.models.AppRole;
import com.mev.recipeapp.models.CustomUserDetails;
import com.mev.recipeapp.models.Role;
import com.mev.recipeapp.models.User;
import com.mev.recipeapp.repository.RoleRepository;
import com.mev.recipeapp.repository.UserRepository;
import com.mev.recipeapp.security.jwt.JwtUtil;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.AuthenticationException;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@RequiredArgsConstructor
@RestController
@RequestMapping("/auth")
public class AuthController {

    private final UserRepository userRepository;
    private final RoleRepository roleRepository;
    private final JwtUtil jwtUtil;
    private final PasswordEncoder passwordEncoder;
    private final AuthenticationManager authenticationManager;

    @PostMapping("public/signup")
    public ResponseEntity<?> registerUser(@RequestBody SignUpRequest signUpRequest) {
        if (userRepository.existsByEmail(signUpRequest.getEmail())) {
            return ResponseEntity.badRequest().body(Map.of("message", "Email address already in use!"));
        }

        User user = new User(
                signUpRequest.getName(),
                signUpRequest.getSurname(),
                signUpRequest.getEmail(),
                passwordEncoder.encode(signUpRequest.getPassword())
        );

        Role role = roleRepository.findByRoleName(AppRole.ROLE_USER).orElseThrow(() -> new RuntimeException("Error: Role is not found."));

        user.setRole(role);

        userRepository.save(user);

        return ResponseEntity.ok().body("User registered successfully!");
    }

    @PostMapping("/public/signin")
    public ResponseEntity<?> authenticateUser(@RequestBody LoginRequest loginRequest) {
        Authentication authentication;
        try {
            authentication = authenticationManager
                    .authenticate(new UsernamePasswordAuthenticationToken(loginRequest.getEmail(), loginRequest.getPassword()));
        } catch (AuthenticationException e) {
            return ResponseEntity.badRequest().body("Invalid username/password supplied!");
        }

        SecurityContextHolder.getContext().setAuthentication(authentication);

        UserDetails userDetails = (UserDetails) authentication.getPrincipal();

        String jwtToken = jwtUtil.generateTokenFromUsername(userDetails);

        LoginResponse loginResponse = new LoginResponse(jwtToken, userDetails.getUsername());

        return ResponseEntity.ok(loginResponse);
    }

    // Get mapping for User auth/user
    @GetMapping("/user")
    public ResponseEntity<?> getCurrentUserDetails(@AuthenticationPrincipal UserDetails userDetails) {
        User user = userRepository.findByEmailWithRole(userDetails.getUsername());

        if (user == null) {
            return ResponseEntity.badRequest().body("User not found!");
        }

        List<String> roles = userDetails.getAuthorities().stream()
                .map(item -> item.getAuthority())
                .collect(Collectors.toList());

        UserInfoResponse userInfoResponse = new UserInfoResponse(
                user.getId(),
                user.getName(),
                user.getSurname(),
                user.getEmail(),
                roles,
                user.isEnabled(),
                user.getCreatedDate().toString()
        );

        return ResponseEntity.ok(userInfoResponse);
    }

    @PostMapping("/change-password/{userId}")
    @PreAuthorize("hasAuthority('ROLE_ADMIN') or @ownership.isSelf(#userId, authentication)")
    public ResponseEntity<?> changePassword(@PathVariable Long userId,
                                            @RequestBody PasswordChangeRequest passwordChangeRequest,
                                            @AuthenticationPrincipal CustomUserDetails currentUser) {
        User user = userRepository.findById(userId).orElseThrow(() -> new RuntimeException("User not found!"));

        if (passwordChangeRequest.getNewPassword() == null || passwordChangeRequest.getNewPassword().isBlank()) {
            return ResponseEntity.badRequest().body(new AuthErrorResponse("New password must not be empty!"));
        }

        // Users changing their own password must always prove they know the old one.
        // Only an admin resetting *another* user's password may skip it.
        boolean changingOwnPassword = currentUser.getId().equals(userId);
        if (changingOwnPassword) {
            String oldPassword = passwordChangeRequest.getOldPassword();
            if (oldPassword == null || !passwordEncoder.matches(oldPassword, user.getPassword())) {
                return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(new AuthErrorResponse("Old password is incorrect!"));
            }
        }

        user.setPassword(passwordEncoder.encode(passwordChangeRequest.getNewPassword()));
        userRepository.save(user);
        return ResponseEntity.ok().build();
    }
}

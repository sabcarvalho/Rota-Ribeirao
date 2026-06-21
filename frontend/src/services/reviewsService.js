import { api } from './api';
import { refreshToken } from './authService';
import { TokenExpiredError } from './errors_classes';

export async function getPlaceReviews(id_place) {
    return await api.get('reviews', `/places/${id_place}/reviews`);
}

export async function getUserReviews(id_usuario) {
  return await api.get('reviews', `/reviews/user/${id_usuario}`);
}

export async function addReview(id_place, data) {
  return await api.post('reviews', `/places/${id_place}/reviews`, data);
}

export async function deleteReview(id_review) {
  try {
    return await api.delete('reviews', `/reviews/${id_review}`);
  } catch (error) {
    if (error.status === 401 || error.detail?.code === "TOKEN_EXPIRED") {
      try {
        await refreshToken();
        return await api.delete('reviews', `/reviews/${id_review}`);
      } catch (refreshErr) {
        if (refreshErr instanceof TokenExpiredError) {
          console.error("Refresh token também expirou. Forçando logout.");
        }
        throw refreshErr;
      }
    } else {
      console.error("Erro na requisição: ", error);
      throw error;
    }
  }
}

export async function getReviewsCount() {
  try {
    const data = await api.get('reviews', '/reviews/count');
    return data?.total || 0;
  } catch (error) {
    console.error("Erro ao contar avaliações:", error);
    return 0;
  }
}

export function calculateNewAverageRating(currentRating, totalReviews, newRating) {
  const current = Number(currentRating) || 0;
  const total = Number(totalReviews) || 0;
  const newValue = Number(newRating) || 0;

  if (total === 0) {
    return Number(newValue.toFixed(1));
  }

  const newAverage = ((current * total) + newValue) / (total + 1);
  return Number(newAverage.toFixed(1));
}
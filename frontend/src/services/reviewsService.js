import { api } from './api';
import { refreshToken } from './authService';
import { TokenExpiredError } from './errors_classes';

export async function getPlaceReviews(id_place) {
  try {
    return await api.get('reviews', `/places/${id_place}/reviews`);
  } catch (error) {
    if (error.status === 401 || error.detail?.code === "TOKEN_EXPIRED") {
      try {
        await refreshToken(); 
        return await api.get('reviews', `/places/${id_place}/reviews`);
      } catch (refreshErr) {
        if(refreshErr instanceof TokenExpiredError){
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

export async function getUserReviews(id_usuario) {
  try {
    return await api.get('reviews', `/reviews/user/${id_usuario}`);
  } catch (error) {
    if (error.status === 401 || error.detail?.code === "TOKEN_EXPIRED") {
      try {
        await refreshToken();
        return await api.get('reviews', `/reviews/user/${id_usuario}`);
      } catch (refreshErr) {
        if(refreshErr instanceof TokenExpiredError){
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

export async function addReview(id_place, data) {
  try {
    return await api.post('reviews', `/places/${id_place}/reviews`, data);
  } catch (error) {
    if (error.status === 401 || error.detail?.code === "TOKEN_EXPIRED") {
      try {
        await refreshToken(); 
        return await api.post('reviews', `/places/${id_place}/reviews`, data);
      } catch (refreshErr) {
        if(refreshErr instanceof TokenExpiredError){
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
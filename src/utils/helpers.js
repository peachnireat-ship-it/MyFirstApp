export const formatDate = (date) => {
  return new Date(date).toLocaleDateString('ko-KR');
};

export const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

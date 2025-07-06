const BaseModel = require('./BaseModel');

class AIQuestions extends BaseModel {
  constructor() {
    super('ai_questions', {
      questionType: 'question_type'
    });
  }

  static async findOne(query) {
    const instance = new AIQuestions();
    return await instance.findOne(query);
  }

  static async find(query = {}) {
    const instance = new AIQuestions();
    return await instance.find(query);
  }

  static async create(data) {
    const instance = new AIQuestions();
    return await instance.create(data);
  }

  static async deleteOne(query) {
    const instance = new AIQuestions();
    return await instance.deleteOne(query);
  }
}

module.exports = AIQuestions;
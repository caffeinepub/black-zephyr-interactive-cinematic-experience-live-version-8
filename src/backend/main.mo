import MixinStorage "blob-storage/Mixin";
import OutCall "http-outcalls/outcall";

actor {
  include MixinStorage();

  // Transformation callback for HTTP response
  public query func transform(input : OutCall.TransformationInput) : async OutCall.TransformationOutput {
    OutCall.transform(input);
  };

  // Outcall to Grok AI API
  public func callGrokAPI(userPrompt : Text) : async Text {
    let url = "https://api.x.ai";
    let authHeader = { name = "Authorization"; value = "Bearer <user-provided-token>" };
    await OutCall.httpPostRequest(url, [authHeader], userPrompt, transform);
  };
};
